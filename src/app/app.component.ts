import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NzLayoutModule, NzMenuModule],
  template: `
    <nz-layout class="app-layout">
      <nz-header>
        <div class="logo">Mandü</div>
      </nz-header>
      <nz-layout>
        <nz-content>
          <router-outlet></router-outlet>
        </nz-content>
      </nz-layout>
    </nz-layout>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
    }
    .logo {
      color: white;
      font-size: 20px;
      padding: 0 24px;
    }
    nz-header {
      background: #1890ff;
      padding: 0;
      display: flex;
      align-items: center;
    }
  `]
})
export class AppComponent {
  title = 'Mandü Divisions';
}