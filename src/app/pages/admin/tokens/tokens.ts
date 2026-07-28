import { Component } from '@angular/core';

@Component({
  selector: 'app-tokens',
  templateUrl: './tokens.html',
  styleUrl: './tokens.css'
})
export class Tokens {
  
  onKeyUp(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;
    // Advance to next input if a character was typed
    if (input.value.length === 1 && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
    // Go back if backspace is pressed
    if (event.key === 'Backspace' && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        // optionally clear it: (prevInput as HTMLInputElement).value = '';
      }
    }
  }

}
