import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
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
  private toastr = inject(ToastrService);
  router = inject(Router);

  papers: Paper[] = [];
  filteredPapers: Paper[] = [];
  stats: any = null;
  currentUser$ = this.authService.currentUser$;
  filter: 'All' | 'TO_READ' | 'IN_PROGRESS' | 'READ' = 'All';
  filterOptions: ('All' | 'TO_READ' | 'IN_PROGRESS' | 'READ')[] = ['All', 'TO_READ', 'IN_PROGRESS', 'READ'];
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

  setFilter(filter: string) {
    this.filter = filter as 'All' | 'TO_READ' | 'IN_PROGRESS' | 'READ';
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

  validateUrl(url: string | null | undefined): boolean {
    if (!url || url.trim() === '') return true; // Allow empty
    const trimmed = url.trim();
    
    // More lenient validation - accept URLs with or without protocol
    // Pattern: (optional protocol) domain (optional path)
    // Examples: test.com, www.facebook.com, http://example.com, example.com/path
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+\.)+[a-z]{2,}(\/.*)?$/i;
    return urlPattern.test(trimmed);
  }

  normalizeUrl(url: string | undefined | null): string | undefined {
    if (!url || url.trim() === '') return undefined;
    const trimmed = url.trim();
    // If it already has protocol, return as is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    // Otherwise, add https:// prefix
    return 'https://' + trimmed;
  }

  addPaper() {
    if (!this.newPaper.title || !this.newPaper.authors) {
      this.toastr.warning('Title and Authors are required');
      return;
    }

    // Validate and normalize URL if provided
    let normalizedLink: string | undefined = undefined;
    if (this.newPaper.link) {
      const trimmed = this.newPaper.link.trim();
      if (trimmed) {
        if (!this.validateUrl(trimmed)) {
          this.toastr.error('Please enter a valid URL (e.g., example.com or https://example.com)');
          return;
        }
        // Normalize URL (add https:// if missing)
        normalizedLink = this.normalizeUrl(trimmed);
      }
    }

    const paperData = {
      ...this.newPaper,
      link: normalizedLink, // Use normalized URL or undefined if empty
      tags: this.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      year: this.newPaper.year ? Number(this.newPaper.year) : undefined
    };

    this.paperService.createPaper(paperData).subscribe({
      next: () => {
        this.loadPapers();
        this.loadStats();
        this.closeAddModal();
        this.toastr.success('Paper added successfully');
      },
      error: (err) => {
        console.error('Failed to create paper:', err);
        this.toastr.error(err.error?.message || 'Failed to add paper');
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
        this.toastr.success('Paper deleted successfully');
      },
      error: (err) => {
        console.error('Failed to delete paper:', err);
        this.toastr.error(err.error?.message || 'Failed to delete paper');
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

  getFullUrl(link: string | undefined | null): string {
    if (!link) return '';
    // If link already has protocol, return as is
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }
    // Otherwise, add https://
    return 'https://' + link;
  }

  openLink(event: Event, link: string | undefined | null) {
    if (!link) return;
    event.preventDefault();
    const fullUrl = this.getFullUrl(link);
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  }

  clearLink() {
    this.newPaper.link = '';
  }
}

