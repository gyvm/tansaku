import React, { useState } from 'react';
import './styles/globals.css';

// Basic
import { Button, Input, TextArea } from './components/basic/Forms';
import { Card, GlassCard, Badge } from './components/basic/Cards';
import { Checkbox, Switch } from './components/basic/Toggles';

// Creative
import { StampButton } from './components/creative/StampButton';
import { ClipToggle } from './components/creative/ClipToggle';
import { AnalogKnob } from './components/creative/AnalogKnob';
import { ZipperSlider } from './components/creative/ZipperSlider';
import { DialPad } from './components/creative/DialPad';
import { FoggyGlassCard } from './components/creative/FoggyGlassCard';
import { TicketCard } from './components/creative/TicketCard';
import { CrtFrame } from './components/creative/CrtFrame';
import { PolaroidFrame } from './components/creative/PolaroidFrame';
import { ReceiptList } from './components/creative/ReceiptList';
import { SealingWax } from './components/creative/SealingWax';
import { StampDate } from './components/creative/StampDate';
import { NeonBadge } from './components/creative/NeonBadge';
import { TypewriterInput } from './components/creative/TypewriterInput';
import { CassettePlayer } from './components/creative/CassettePlayer';

export default function RetroGlassUI() {
  const [knobValue, setKnobValue] = useState(30);
  const [zipValue, setZipValue] = useState(20);
  const [dialed, setDialed] = useState('');

  const handleDial = (d: string) => {
    setDialed(prev => (prev + d).slice(-10));
  };

  return (
    <div className="retro-glass-ui-wrapper min-h-screen bg-[#e8eaf0] texture-noise p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Header */}
        <header className="text-center py-10">
          <Badge variant="neutral">Design System v1.0</Badge>
          <h1 className="font-display text-5xl md:text-7xl mt-4 mb-6 text-[#2c3e50] tracking-tight">
            Retro Glass UI
          </h1>
          <p className="text-xl text-[#546e7a] max-w-2xl mx-auto font-light">
            A curated collection of "Lo-Fi Paper & Glass" components. <br/>
            Blending nostalgic textures with modern glassmorphism interaction.
          </p>
        </header>

        {/* Section 1: Basic Toolkit */}
        <section className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-[#2c3e50] font-display">01. The Basics</h2>
            <div className="h-[1px] bg-[#d1d5db] flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Buttons & Forms */}
            <Card className="space-y-6">
              <h3 className="font-bold text-[#5d6d7e] uppercase text-xs tracking-wider">Buttons & Inputs</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="space-y-4">
                <Input placeholder="Enter your email..." label="Email Address" />
                <TextArea placeholder="Type your message..." label="Message" rows={2} />
              </div>
            </Card>

            {/* Toggles & Badges */}
            <GlassCard className="space-y-6">
              <h3 className="font-bold text-[#5d6d7e] uppercase text-xs tracking-wider">Toggles & Status</h3>
              <div className="space-y-3">
                <Checkbox label="Remember nostalgia" checked={true} />
                <Checkbox label="Enable glass effect" />
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm">Power Saving</span>
                  <Switch checked={true} />
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="success">Active</Badge>
                <Badge variant="warning">Pending</Badge>
                <Badge variant="neutral">Archived</Badge>
              </div>
            </GlassCard>

            {/* Typography Preview */}
            <div className="p-6">
              <h3 className="font-bold text-[#5d6d7e] uppercase text-xs tracking-wider mb-4">Typography</h3>
              <div className="space-y-2">
                <p className="font-display text-3xl">Special Elite</p>
                <p className="font-display text-xl opacity-60">The quick brown fox jumps over the lazy dog.</p>
                <p className="font-body text-3xl mt-6">DM Sans</p>
                <p className="font-body text-xl opacity-60">Clean, modern sans-serif for readability.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Creative Showcase */}
        <section className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-[#2c3e50] font-display">02. Creative Workshop</h2>
            <div className="h-[1px] bg-[#d1d5db] flex-1" />
          </div>

          {/* Interactive Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col items-center gap-4 p-6 bg-[#fdfbf7] rounded-xl border border-[#d1d5db]">
              <span className="text-xs text-gray-400">Stamp Button</span>
              <StampButton text="Approve" />
            </div>

            <div className="flex flex-col items-center gap-4 p-6 bg-[#fdfbf7] rounded-xl border border-[#d1d5db]">
               <span className="text-xs text-gray-400">Clip Toggle</span>
               <ClipToggle enabled={true} onToggle={()=>{}} />
            </div>

            <div className="flex flex-col items-center gap-4 p-6 bg-[#fdfbf7] rounded-xl border border-[#d1d5db]">
               <span className="text-xs text-gray-400">Analog Knob ({Math.round(knobValue)})</span>
               <AnalogKnob value={knobValue} onChange={setKnobValue} />
            </div>

            <div className="flex flex-col items-center gap-4 p-6 bg-[#fdfbf7] rounded-xl border border-[#d1d5db]">
               <span className="text-xs text-gray-400">Sealing Wax</span>
               <SealingWax icon="J" />
            </div>
          </div>

          {/* Visual Effects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FoggyGlassCard title="Secret Project">
              <p>Hover to reveal the classified information hidden behind the fog.</p>
              <div className="mt-4 flex justify-center">
                 <Button size="sm">Access Granted</Button>
              </div>
            </FoggyGlassCard>

            <FoggyGlassCard title="Hidden Data">
              <div className="grid grid-cols-2 gap-2 text-left">
                <strong>Status:</strong> <span>Active</span>
                <strong>Level:</strong> <span>5</span>
                <strong>Code:</strong> <span>88-XJ</span>
              </div>
            </FoggyGlassCard>

            <div className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute top-2 right-2"><StampDate date="12 OCT 1985" /></div>
               <p className="font-display text-2xl text-center mt-4">Nostalgia<br/>Glass</p>
            </div>
          </div>

          {/* Complex Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-8">
               <div className="bg-[#2c3e50] p-8 rounded-2xl flex justify-center">
                  <TicketCard event="Cinema Paradiso" date="NOV 12, 2023" seat="H-12" />
               </div>

               <div className="flex justify-center">
                  <CassettePlayer />
               </div>

               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h4 className="font-display mb-4">Typewriter Mode</h4>
                  <TypewriterInput placeholder="Start typing..." />
               </div>
            </div>

            <div className="space-y-8">
               <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                  <PolaroidFrame src="https://images.unsplash.com/photo-1595079676339-1534801fafde?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60" caption="Summer '98" />
                  <ReceiptList
                    items={[
                      { name: 'Coffee', price: '$4.50' },
                      { name: 'Bagel', price: '$3.00' },
                      { name: 'Nostalgia', price: '$0.00' },
                    ]}
                    total="$7.50"
                  />
               </div>

               <CrtFrame>
                 SYSTEM BOOT SEQUENCE...<br/>
                 LOADING RETRO_UI.DLL...<br/>
                 SUCCESS.<br/>
                 <br/>
                 _
               </CrtFrame>
            </div>
          </div>

          {/* Fun & Decoration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="col-span-1 lg:col-span-2 p-6 bg-white rounded-xl border border-gray-200">
               <h4 className="font-display mb-4">Zipper Slider</h4>
               <ZipperSlider value={zipValue} onChange={setZipValue} />
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-xl border-4 border-slate-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
               <NeonBadge text="Cyberpunk" color="pink" />
               <div className="h-4"/>
               <NeonBadge text="Future" color="blue" />
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-gray-100 rounded-xl">
               <DialPad onDigitSelect={handleDial} />
               <div className="mt-4 font-mono text-xl tracking-widest">{dialed || "..."}</div>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
}
