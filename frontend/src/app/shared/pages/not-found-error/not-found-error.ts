import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-error',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found-error.html',
})
export class NotFoundError {}
