use std::cell::UnsafeCell;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

/// Lock-free Single-Producer Single-Consumer ring buffer for audio data.
///
/// The producer (audio thread) writes samples via `write()`,
/// the consumer (writer/UI thread) reads via `read()`.
///
/// Safety contract: exactly one thread may call `write()` and exactly one
/// thread may call `read()` concurrently. Multiple concurrent writers or
/// multiple concurrent readers are undefined behavior.
pub struct SpscRingBuffer {
    buffer: UnsafeCell<Vec<f32>>,
    capacity: usize,
    write_idx: AtomicUsize,
    read_idx: AtomicUsize,
}

impl SpscRingBuffer {
    /// Create a new ring buffer with the given capacity.
    /// Panics if capacity < 2 (need at least 1 sentinel + 1 data slot).
    pub fn new(capacity: usize) -> Arc<Self> {
        assert!(capacity >= 2, "SpscRingBuffer capacity must be >= 2");
        Arc::new(Self {
            buffer: UnsafeCell::new(vec![0.0f32; capacity]),
            capacity,
            write_idx: AtomicUsize::new(0),
            read_idx: AtomicUsize::new(0),
        })
    }

    /// Number of samples available to read.
    pub fn available(&self) -> usize {
        let w = self.write_idx.load(Ordering::Acquire);
        let r = self.read_idx.load(Ordering::Acquire);
        if w >= r {
            w - r
        } else {
            self.capacity - r + w
        }
    }

    /// Space available for writing.
    pub fn free_space(&self) -> usize {
        self.capacity - 1 - self.available()
    }

    /// Write samples into the ring buffer. Returns number of samples actually written.
    /// If the buffer is full, excess samples are dropped (not written).
    ///
    /// Safety: must only be called from a single producer thread.
    pub fn write(&self, data: &[f32]) -> usize {
        let free = self.free_space();
        let to_write = data.len().min(free);
        if to_write == 0 {
            return 0;
        }

        let w = self.write_idx.load(Ordering::Relaxed);

        // Safety: UnsafeCell grants interior mutability. Only the single producer
        // thread writes to the buffer region [write_idx..], and atomic index
        // updates with Release/Acquire ordering ensure the consumer sees
        // consistent data.
        let buf_ptr = unsafe { (*self.buffer.get()).as_mut_ptr() };

        let first_part = (self.capacity - w).min(to_write);
        unsafe {
            std::ptr::copy_nonoverlapping(data.as_ptr(), buf_ptr.add(w), first_part);
        }

        if to_write > first_part {
            let second_part = to_write - first_part;
            unsafe {
                std::ptr::copy_nonoverlapping(data.as_ptr().add(first_part), buf_ptr, second_part);
            }
        }

        let new_w = (w + to_write) % self.capacity;
        self.write_idx.store(new_w, Ordering::Release);

        to_write
    }

    /// Read samples from the ring buffer. Returns number of samples actually read.
    ///
    /// Safety: must only be called from a single consumer thread.
    pub fn read(&self, out: &mut [f32]) -> usize {
        let avail = self.available();
        let to_read = out.len().min(avail);
        if to_read == 0 {
            return 0;
        }

        let r = self.read_idx.load(Ordering::Relaxed);
        // Safety: the consumer only reads from [read_idx..write_idx], which the
        // producer has finished writing (guaranteed by Acquire on write_idx).
        let buf_ptr = unsafe { (*self.buffer.get()).as_ptr() };

        let first_part = (self.capacity - r).min(to_read);
        unsafe {
            std::ptr::copy_nonoverlapping(buf_ptr.add(r), out.as_mut_ptr(), first_part);
        }

        if to_read > first_part {
            let second_part = to_read - first_part;
            unsafe {
                std::ptr::copy_nonoverlapping(buf_ptr, out.as_mut_ptr().add(first_part), second_part);
            }
        }

        let new_r = (r + to_read) % self.capacity;
        self.read_idx.store(new_r, Ordering::Release);

        to_read
    }

    /// Drain all available samples into a Vec.
    pub fn drain(&self) -> Vec<f32> {
        let avail = self.available();
        if avail == 0 {
            return Vec::new();
        }
        let mut out = vec![0.0f32; avail];
        self.read(&mut out);
        out
    }
}

// Safety: SpscRingBuffer uses UnsafeCell for interior mutability with atomic
// index operations providing synchronization. The SPSC contract (single producer,
// single consumer) must be upheld by the caller.
unsafe impl Send for SpscRingBuffer {}
unsafe impl Sync for SpscRingBuffer {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_write_read() {
        let rb = SpscRingBuffer::new(1024);
        let data = [1.0f32, 2.0, 3.0, 4.0];
        assert_eq!(rb.write(&data), 4);
        assert_eq!(rb.available(), 4);

        let mut out = [0.0f32; 4];
        assert_eq!(rb.read(&mut out), 4);
        assert_eq!(out, data);
        assert_eq!(rb.available(), 0);
    }

    #[test]
    fn test_wraparound() {
        let rb = SpscRingBuffer::new(8);
        let data = [1.0f32; 6];
        assert_eq!(rb.write(&data), 6);

        let mut out = [0.0f32; 4];
        assert_eq!(rb.read(&mut out), 4);

        let data2 = [2.0f32; 5];
        assert_eq!(rb.write(&data2), 5);
        assert_eq!(rb.available(), 7);

        let mut out2 = [0.0f32; 7];
        assert_eq!(rb.read(&mut out2), 7);
        assert_eq!(&out2[..2], &[1.0, 1.0]);
        assert_eq!(&out2[2..], &[2.0, 2.0, 2.0, 2.0, 2.0]);
    }

    #[test]
    fn test_overflow_drops() {
        let rb = SpscRingBuffer::new(4);
        let data = [1.0f32; 10];
        assert_eq!(rb.write(&data), 3);
    }

    #[test]
    fn test_drain() {
        let rb = SpscRingBuffer::new(1024);
        rb.write(&[1.0, 2.0, 3.0]);
        let drained = rb.drain();
        assert_eq!(drained, vec![1.0, 2.0, 3.0]);
        assert_eq!(rb.available(), 0);
    }

    #[test]
    #[should_panic(expected = "capacity must be >= 2")]
    fn test_capacity_too_small() {
        SpscRingBuffer::new(1);
    }
}
