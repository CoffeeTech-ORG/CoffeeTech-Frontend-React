import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Division } from '../../models/division.model';
import { DivisionService } from '../../services/division.service';

@Component({
  selector: 'app-division-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule
  ],
  templateUrl: './division-list.component.html',
  styleUrls: ['./division-list.component.scss']
})
export class DivisionListComponent implements OnInit {
  divisions: Division[] = [];
  searchValue = '';
  loading = true;

  constructor(private divisionService: DivisionService) {}

  ngOnInit(): void {
    this.loadDivisions();
  }

  loadDivisions(): void {
    this.loading = true;
    this.divisionService.getDivisions().subscribe({
      next: (data) => {
        this.divisions = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading divisions:', error);
        this.loading = false;
      }
    });
  }

  search(): void {
    this.divisions = this.divisions.filter((item) =>
      item.name.toLowerCase().includes(this.searchValue.toLowerCase())
    );
  }

  reset(): void {
    this.searchValue = '';
    this.loadDivisions();
  }
}