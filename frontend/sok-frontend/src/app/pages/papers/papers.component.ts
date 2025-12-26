import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PaperService, Paper } from '../../services/paper.service';
import { StatsService } from '../../services/stats.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-papers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './papers.component.html',
  styleUrl: './papers.component.css'
})
export class PapersComponent implements OnInit {
  private paperService = inject(PaperService);
  private statsService = inject(StatsService);
  private authService = inject(AuthService);
  router = inject(Router);

  papers: Paper[] = [];
  filteredPapers: Paper[] = [];
  stats: any = null;
  currentUser$ = this.authService.currentUser$;
  filter: 'All' | 'TO_READ' | 'IN_PROGRESS' | 'READ' = 'All';
  showAddModal = false;
  newPaper: Partial<Paper> = {
    title: '',
    authors: '',
    venue: '',
    year: undefined,
    link: '',
    readingStatus: 'TO_READ',
    tags: []
  };
  tagsInput = '';

  ngOnInit() {
    this.loadPapers();
    this.loadStats();
  }

  loadPapers() {
    this.paperService.getPapers().subscribe({
      next: (response) => {
        this.papers = response.papers;
        this.applyFilter();
      },
      error: (err) => {
        console.error('Failed to load papers:', err);
      }
    });
  }

  loadStats() {
    this.statsService.getOverview().subscribe({
      next: (response) => {
        this.stats = response.stats;
      },
      error: (err) => {
        console.error('Failed to load stats:', err);
      }
    });
  }

  applyFilter() {
    if (this.filter === 'All') {
      this.filteredPapers = this.papers;
    } else {
      this.filteredPapers = this.papers.filter(p => p.readingStatus === this.filter);
    }
  }

  setFilter(filter: 'All' | 'TO_READ' | 'IN_PROGRESS' | 'READ') {
    this.filter = filter;
    this.applyFilter();
  }

  openAddModal() {
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.resetForm();
  }

  resetForm() {
    this.newPaper = {
      title: '',
      authors: '',
      venue: '',
      year: undefined,
      link: '',
      readingStatus: 'TO_READ',
      tags: []
    };
    this.tagsInput = '';
  }

  addPaper() {
    if (!this.newPaper.title || !this.newPaper.authors) {
      return;
    }

    const paperData = {
      ...this.newPaper,
      tags: this.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      year: this.newPaper.year ? Number(this.newPaper.year) : undefined
    };

    this.paperService.createPaper(paperData).subscribe({
      next: () => {
        this.loadPapers();
        this.loadStats();
        this.closeAddModal();
      },
      error: (err) => {
        console.error('Failed to create paper:', err);
      }
    });
  }

  deletePaper(id: string) {
    if (!confirm('Are you sure you want to delete this paper?')) {
      return;
    }

    this.paperService.deletePaper(id).subscribe({
      next: () => {
        this.loadPapers();
        this.loadStats();
      },
      error: (err) => {
        console.error('Failed to delete paper:', err);
        alert(err.error?.message || 'Failed to delete paper');
      }
    });
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'READ':
        return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}

