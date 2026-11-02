/*
  AI Use Disclosure
  Claude (Anthropic's AI assistant) assisted me in writing this script, which mainly serves to make the Save button in my Beta Description work: the save/unsave toggle, the "Saved!" pop, the burst lines, and the button resizing smoothly to fit its text. Claude also wrote a guide explaining how every part of it works, which I studied to ensure full understanding. All code has been reviewed and edited by me, and I wrote the microinteraction breakdown.
*/

// ------------------- Settings (match the Beta Description) -------------------
const SAVED_HOLD = 1000; // "Saved!" shows for 1 second before settling to "Saved"

// The six burst lines. Each one starts at a point on the button's edge and
// shoots out in a direction:
//   x, y  = where on the button it starts (0 = left/top edge, 1 = right/bottom edge)
//   angle = which way it travels, in degrees (0 = right, 90 = down, 180 = left)
// The button sits in the pin's top right corner, so the lines only go left and down.
const BURST_LINES = [
  { x: 0, y: 0.15, angle: 217 }, // up and left
  { x: 0, y: 0.5, angle: 180 }, // straight left
  { x: 0, y: 0.85, angle: 143 }, // down and left
  { x: 0.2, y: 1, angle: 104 }, // down, leaning left
  { x: 0.55, y: 1, angle: 90 }, // straight down
  { x: 0.9, y: 1, angle: 73 }, // down, leaning right
];

// ------------------- Set up every pin on the page -------------------
// querySelectorAll finds both pins. Each one gets its own Save button logic,
// so saving one pin never affects the other.
document.querySelectorAll(".pin").forEach(setUpPin);

function setUpPin(pin) {
  const button = pin.querySelector(".pin-save");
  const label = pin.querySelector(".pin-save-label");

  let saved = false; // is this pin saved right now?
  let holdTimer = null; // the 1-second "Saved!" timer, so we can cancel it

  button.addEventListener("click", () => {
    // Cancel any "Saved!" -> "Saved" swap that hasn't happened yet,
    // in case the user unsaves during the 1-second hold
    clearTimeout(holdTimer);

    saved = !saved; // flip between saved and unsaved
    button.classList.toggle("is-saved", saved); // CSS turns it #333333 grey
    button.setAttribute("aria-pressed", saved); // tells screen readers it's on/off

    if (saved) {
      // Toggle ON Click
      changeText(button, label, "Saved!", { fade: false });
      popLabel(label);
      burst(button);

      // After 1 second, "Saved!" fades into "Saved"
      holdTimer = setTimeout(() => {
        changeText(button, label, "Saved", { fade: true });
      }, SAVED_HOLD);

      // Hypothetical backend: add the pin to the board in the selector
    } else {
      // Toggle OFF Click
      label.classList.remove("is-popping");
      changeText(button, label, "Save", { fade: true });

      // Hypothetical backend: remove the pin from that board
    }
  });
}

// ------------------- Change the button's text and width -------------------
// CSS can't animate width: auto, so we measure the width the button WILL be
// with the new text, then animate from the current pixel width to that one.
function changeText(button, label, newText, { fade }) {
  const startWidth = button.offsetWidth;
  const endWidth = measureWidth(button, label, newText);

  // 1. Lock the button at its current width in pixels
  button.style.width = startWidth + "px";
  // 2. Make the browser apply that width right now (reading offsetWidth
  //    forces it), so the next change counts as a change it can animate
  button.offsetWidth;
  // 3. Set the new width. The CSS transition animates it over 150ms.
  //    It's anchored with right: 12px, so it grows/shrinks toward the left.
  button.style.width = endWidth + "px";

  if (fade) {
    // Crossfade: leave a copy of the old text (a "ghost") on top of the
    // label and fade it out over 150ms. Underneath, the label already shows
    // the new text, so there's never a moment with no text at all.
    const ghost = document.createElement("span");
    ghost.className = "pin-save-ghost";
    ghost.textContent = label.textContent;
    // Delete the ghost once its fade finishes
    ghost.addEventListener("animationend", () => ghost.remove());
    button.appendChild(ghost);
  }

  label.textContent = newText;
}

// Temporarily put the new text in, let the button size itself, read the
// width, then put everything back. The browser never paints in between,
// so the user never sees this happen.
function measureWidth(button, label, text) {
  const oldText = label.textContent;
  const oldWidth = button.style.width;

  label.textContent = text;
  button.style.width = "auto";
  const width = button.offsetWidth;

  label.textContent = oldText;
  button.style.width = oldWidth;
  return width;
}

// ------------------- "Saved!" pop -------------------
function popLabel(label) {
  // Removing and re-adding the class restarts the animation if it's already
  // running (for example, a quick save, unsave, save)
  label.classList.remove("is-popping");
  label.offsetWidth; // force the browser to notice the class is gone
  label.classList.add("is-popping");
}

// ------------------- Burst lines -------------------
function burst(button) {
  BURST_LINES.forEach((line) => {
    const el = document.createElement("span");
    el.className = "pin-burst-line";

    // Place it on the button's edge (the button is the positioned parent).
    // Percentages keep the lines attached to the edges while the button widens.
    el.style.left = line.x * 100 + "%";
    el.style.top = line.y * 100 + "%";
    // Hand the direction to the CSS animation as a custom property
    el.style.setProperty("--angle", line.angle + "deg");

    // Delete the line once its 950ms animation finishes, so they don't pile up
    el.addEventListener("animationend", () => el.remove());

    button.appendChild(el);
  });
}
