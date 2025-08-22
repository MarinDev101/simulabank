import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateFormat' })
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date, format = 'short'): string {
    const d = new Date(value);
    return d.toLocaleString();
  }
}
