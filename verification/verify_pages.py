from playwright.sync_api import sync_playwright

def verify_step_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser Error: {err}"))

        # 1. Step UI Verification
        try:
            print("Navigating to Voice Notes (Step UI)...")
            page.goto("http://localhost:5173/voice-notes-step")
            # Wait for any content to load first to see if we get *anything*
            page.wait_for_selector("#root", state="visible")
            print("Root found.")

            # Now wait for specific app wrapper
            page.wait_for_selector(".vn-step-wrapper", state="visible", timeout=5000)

            # Step 1: Upload
            page.screenshot(path="verification/step_01_upload.png")
            print("Step 1 (Upload) Screenshot taken.")

        except Exception as e:
            print(f"Error in Step UI verification: {e}")

        # 2. Dash UI Verification
        try:
            print("Navigating to Voice Notes (Dash UI)...")
            page.goto("http://localhost:5173/voice-notes-dash")

            page.wait_for_selector(".vn-dash-layout", state="visible", timeout=5000)

            page.screenshot(path="verification/dash_01_main.png")
            print("Dash UI Screenshot taken.")

        except Exception as e:
            print(f"Error in Dash UI verification: {e}")

        browser.close()

if __name__ == "__main__":
    verify_step_ui()
