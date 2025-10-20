import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-return-button',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './return-button.html',
})
export class ReturnButton {}
