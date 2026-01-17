import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  data: any = {

  };

  ngOnInit(): void {
    const checkData = setInterval(() => {
      const win = window as any;
      if (win['PDF_DATA']) {
        this.data = win['PDF_DATA'];
        clearInterval(checkData);
      }
    }, 50);
  }
}
