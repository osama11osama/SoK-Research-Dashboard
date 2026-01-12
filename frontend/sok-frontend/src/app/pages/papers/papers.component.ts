import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { PaperService, Paper } from '../../services/paper.service';
import { StatsService } from '../../services/stats.service';
import { AuthService } from '../../services/auth.service';
import { TagService, Tag } from '../../services/tag.service';
import { ThreatModelService, ThreatModel } from '../../services/threat-model.service';
import { SettingsService } from '../../services/settings.service';
import { FavoriteService } from '../../services/favorite.service';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-papers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, NotificationBellComponent, ThemeToggleComponent],
  templateUrl: './papers.component.html',
  styleUrl: './papers.component.css'
})
export class PapersComponent implements OnInit {
  private paperService = inject(PaperService);
  private statsService = inject(StatsService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private tagService = inject(TagService);
  private threatModelService = inject(ThreatModelService);
  private settingsService = inject(SettingsService);
  private favoriteService = inject(FavoriteService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  papers: Paper[] = [];
  filteredPapers: Paper[] = [];
  stats: any = null;
  currentUser$ = this.authService.currentUser$;
  settings$ = this.settingsService.settings$;
  filter: 'All' | 'TO_READ' | 'IN_PROGRESS' | 'READ' = 'All';
  filterOptions: ('All' | 'TO_READ' | 'IN_PROGRESS' | 'READ')[] = ['All', 'TO_READ', 'IN_PROGRESS', 'READ'];
  showAddModal = false;
  selectedPaperIds: Set<string> = new Set();
  showDeleteConfirmModal = false;
  isDeleting = false;
  showExportMenu = false;
  newPaper: Partial<Paper> = {
    title: '',
    authors: '',
    venue: '',
    year: undefined,
    link: '',
    readingStatus: 'TO_READ',
    tags: []
  };
  selectedTagIds: string[] = [];
  selectedThreatModelIds: string[] = [];
  newTagName = '';
  newThreatModelName = '';
  
  // Tag and Threat Model data
  tags: Tag[] = [];
  threatModels: ThreatModel[] = [];
  selectedTagFilter: string | null = null;
  selectedThreatModelFilter: string | null = null;
  
  // Filter dropdowns
  selectedVenueFilter: string | null = null;
  selectedYearFilter: number | null = null;
  availableVenues: string[] = [];
  availableYears: number[] = [];

  // Text search
  searchQuery = '';

  ngOnInit() {
    this.loadTags();
    this.loadThreatModels();
    this.route.queryParams.subscribe(params => {
      this.selectedTagFilter = params['tag'] || null;
      this.selectedThreatModelFilter = params['threatModel'] || null;
      this.selectedVenueFilter = params['venue'] || null;
      this.selectedYearFilter = params['year'] ? parseInt(params['year']) : null;
      this.loadPapers();
    });
    this.loadStats();
  }

  loadTags() {
    this.tagService.getTags().subscribe({
      next: (response) => {
        this.tags = response.tags;
      },
      error: (err) => {
        console.error('Failed to load tags:', err);
      }
    });
  }

  loadThreatModels() {
    this.threatModelService.getThreatModels().subscribe({
      next: (response) => {
        this.threatModels = response.threatModels;
      },
      error: (err) => {
        console.error('Failed to load threat models:', err);
      }
    });
  }

  loadPapers() {
    this.paperService.getPapers(
      this.selectedTagFilter || undefined,
      this.selectedThreatModelFilter || undefined,
      this.selectedVenueFilter || undefined,
      this.selectedYearFilter || undefined
    ).subscribe({
      next: (response) => {
        this.papers = response.papers;
        this.extractFilterOptions();
        this.applyFilter();
      },
      error: (err) => {
        console.error('Failed to load papers:', err);
      }
    });
  }

  extractFilterOptions() {
    // Extract unique venues
    const venues = new Set<string>();
    const years = new Set<number>();
    
    this.papers.forEach(paper => {
      if (paper.venue && paper.venue.trim()) {
        venues.add(paper.venue.trim());
      }
      if (paper.year) {
        years.add(paper.year);
      }
    });
    
    this.availableVenues = Array.from(venues).sort();
    this.availableYears = Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
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
    let filtered: Paper[];
    if (this.filter === 'All') {
      filtered = [...this.papers];
    } else {
      filtered = this.papers.filter(p => p.readingStatus === this.filter);
    }
    
    // Apply text search if query exists
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(paper => {
        const titleMatch = paper.title?.toLowerCase().includes(query);
        const authorsMatch = paper.authors?.toLowerCase().includes(query);
        const venueMatch = paper.venue?.toLowerCase().includes(query);
        const abstractMatch = paper.sok?.keyFindings?.toLowerCase().includes(query);
        return titleMatch || authorsMatch || venueMatch || abstractMatch;
      });
    }
    
    // Sort favorites first when no filters are applied
    if (!this.selectedTagFilter && !this.selectedThreatModelFilter && !this.selectedVenueFilter && !this.selectedYearFilter && !this.searchQuery.trim()) {
      filtered.sort((a, b) => {
        const aIsFavorite = a.isFavorite ? 1 : 0;
        const bIsFavorite = b.isFavorite ? 1 : 0;
        if (aIsFavorite !== bIsFavorite) {
          return bIsFavorite - aIsFavorite; // Favorites first
        }
        // If both have same favorite status, maintain original order (by createdAt desc)
        return 0;
      });
    }
    
    this.filteredPapers = filtered;
  }

  onSearchChange() {
    this.applyFilter();
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
      tags: [],
      sok: {
        threatModel: []
      }
    };
    this.selectedTagIds = [];
    this.selectedThreatModelIds = [];
    this.newTagName = '';
    this.newThreatModelName = '';
  }

  toggleTag(tagId: string) {
    const index = this.selectedTagIds.indexOf(tagId);
    if (index > -1) {
      this.selectedTagIds.splice(index, 1);
    } else {
      this.selectedTagIds.push(tagId);
    }
  }

  toggleThreatModel(threatModelId: string) {
    const index = this.selectedThreatModelIds.indexOf(threatModelId);
    if (index > -1) {
      this.selectedThreatModelIds.splice(index, 1);
    } else {
      this.selectedThreatModelIds.push(threatModelId);
    }
  }

  addNewTag() {
    if (!this.newTagName.trim()) return;
    
    const tagName = this.newTagName.trim().toLowerCase();
    this.tagService.createTag({ 
      name: tagName,
      displayName: this.newTagName.trim()
    }).subscribe({
      next: (response) => {
        this.tags.push(response.tag);
        this.selectedTagIds.push(response.tag._id);
        this.newTagName = '';
        this.toastr.success('Tag created successfully');
      },
      error: (err) => {
        console.error('Failed to create tag:', err);
        this.toastr.error(err.error?.message || 'Failed to create tag');
      }
    });
  }

  addNewThreatModel() {
    if (!this.newThreatModelName.trim()) return;
    
    const threatModelName = this.newThreatModelName.trim().toLowerCase();
    this.threatModelService.createThreatModel({ 
      name: threatModelName,
      displayName: this.newThreatModelName.trim()
    }).subscribe({
      next: (response) => {
        this.threatModels.push(response.threatModel);
        this.selectedThreatModelIds.push(response.threatModel._id);
        this.newThreatModelName = '';
        this.toastr.success('Threat model created successfully');
      },
      error: (err) => {
        console.error('Failed to create threat model:', err);
        this.toastr.error(err.error?.message || 'Failed to create threat model');
      }
    });
  }

  filterByTag(tagName: string | null) {
    this.selectedTagFilter = tagName;
    const queryParams: any = {};
    if (tagName) queryParams.tag = tagName;
    if (this.selectedThreatModelFilter) queryParams.threatModel = this.selectedThreatModelFilter;
    if (this.selectedVenueFilter) queryParams.venue = this.selectedVenueFilter;
    if (this.selectedYearFilter) queryParams.year = this.selectedYearFilter;
    this.router.navigate(['/app/papers'], { queryParams });
  }

  filterByThreatModel(threatModelName: string | null) {
    this.selectedThreatModelFilter = threatModelName;
    const queryParams: any = {};
    if (this.selectedTagFilter) queryParams.tag = this.selectedTagFilter;
    if (threatModelName) queryParams.threatModel = threatModelName;
    if (this.selectedVenueFilter) queryParams.venue = this.selectedVenueFilter;
    if (this.selectedYearFilter) queryParams.year = this.selectedYearFilter;
    this.router.navigate(['/app/papers'], { queryParams });
  }

  filterByVenue(venue: string | null) {
    this.selectedVenueFilter = venue;
    const queryParams: any = {};
    if (this.selectedTagFilter) queryParams.tag = this.selectedTagFilter;
    if (this.selectedThreatModelFilter) queryParams.threatModel = this.selectedThreatModelFilter;
    if (venue) queryParams.venue = venue;
    if (this.selectedYearFilter) queryParams.year = this.selectedYearFilter;
    this.router.navigate(['/app/papers'], { queryParams });
  }

  filterByYear(year: number | null) {
    this.selectedYearFilter = year;
    const queryParams: any = {};
    if (this.selectedTagFilter) queryParams.tag = this.selectedTagFilter;
    if (this.selectedThreatModelFilter) queryParams.threatModel = this.selectedThreatModelFilter;
    if (this.selectedVenueFilter) queryParams.venue = this.selectedVenueFilter;
    if (year) queryParams.year = year;
    this.router.navigate(['/app/papers'], { queryParams });
  }

  clearFilters() {
    this.selectedTagFilter = null;
    this.selectedThreatModelFilter = null;
    this.selectedVenueFilter = null;
    this.selectedYearFilter = null;
    this.router.navigate(['/app/papers']);
  }

  isTagSelected(tagId: string): boolean {
    return this.selectedTagIds.includes(tagId);
  }

  isThreatModelSelected(threatModelId: string): boolean {
    return this.selectedThreatModelIds.includes(threatModelId);
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

    // Get selected tag names
    const selectedTagNames = this.selectedTagIds
      .map(id => this.tags.find(t => t._id === id)?.name)
      .filter(name => name !== undefined) as string[];

    // Get selected threat model names
    const selectedThreatModelNames = this.selectedThreatModelIds
      .map(id => this.threatModels.find(tm => tm._id === id)?.name)
      .filter(name => name !== undefined) as string[];

    const paperData = {
      ...this.newPaper,
      link: normalizedLink, // Use normalized URL or undefined if empty
      tags: selectedTagNames,
      sok: {
        ...this.newPaper.sok,
        threatModel: selectedThreatModelNames
      },
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
        const errorMessage = err.error?.message || 'Failed to add paper';
        // Show error in red (toastr.error already does this, but ensure it's clear for duplicates)
        if (err.status === 409 || err.error?.duplicate) {
          this.toastr.error(errorMessage, '', {
            timeOut: 5000,
            positionClass: 'toast-top-right'
          });
        } else {
          this.toastr.error(errorMessage);
        }
      }
    });
  }

  pendingStatusChange: { paperId: string; newStatus: 'TO_READ' | 'IN_PROGRESS' | 'READ' } | null = null;
  showStatusConfirmModal = false;

  changeReadingStatus(paperId: string, newStatus: 'TO_READ' | 'IN_PROGRESS' | 'READ') {
    this.pendingStatusChange = { paperId, newStatus };
    this.showStatusConfirmModal = true;
  }

  confirmStatusChange() {
    if (!this.pendingStatusChange) return;

    const { paperId, newStatus } = this.pendingStatusChange;
    this.paperService.updateReadingStatus(paperId, newStatus).subscribe({
      next: () => {
        this.loadPapers();
        this.toastr.success(`Reading status changed to ${newStatus === 'TO_READ' ? 'To Read' : newStatus === 'IN_PROGRESS' ? 'In Progress' : 'Read'}`);
        this.showStatusConfirmModal = false;
        this.pendingStatusChange = null;
      },
      error: (err) => {
        console.error('Failed to update reading status:', err);
        this.toastr.error(err.error?.message || 'Failed to update reading status');
        this.showStatusConfirmModal = false;
        this.pendingStatusChange = null;
      }
    });
  }

  cancelStatusChange() {
    this.showStatusConfirmModal = false;
    this.pendingStatusChange = null;
  }

  deletePaper(id: string) {
    if (!confirm('Are you sure you want to delete this paper?')) {
      return;
    }

    this.paperService.deletePaper(id).subscribe({
      next: () => {
        this.loadPapers();
        this.loadStats();
        this.selectedPaperIds.delete(id);
        this.toastr.success('Paper deleted successfully');
      },
      error: (err) => {
        console.error('Failed to delete paper:', err);
        this.toastr.error(err.error?.message || 'Failed to delete paper');
      }
    });
  }

  togglePaperSelection(paperId: string | undefined) {
    if (!paperId) return;
    if (this.selectedPaperIds.has(paperId)) {
      this.selectedPaperIds.delete(paperId);
    } else {
      this.selectedPaperIds.add(paperId);
    }
  }

  isPaperSelected(paperId: string | undefined): boolean {
    if (!paperId) return false;
    return this.selectedPaperIds.has(paperId);
  }

  toggleSelectAll() {
    if (this.isAllSelected()) {
      this.selectedPaperIds.clear();
    } else {
      this.selectedPaperIds.clear();
      this.filteredPapers.forEach(paper => {
        if (paper._id) {
          this.selectedPaperIds.add(paper._id);
        }
      });
    }
  }

  isAllSelected(): boolean {
    if (this.filteredPapers.length === 0) return false;
    return this.filteredPapers.every(paper => paper._id && this.selectedPaperIds.has(paper._id));
  }

  isSomeSelected(): boolean {
    return this.selectedPaperIds.size > 0 && !this.isAllSelected();
  }

  getSelectedCount(): number {
    return this.selectedPaperIds.size;
  }

  openDeleteConfirmModal() {
    if (this.selectedPaperIds.size === 0) return;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal() {
    this.showDeleteConfirmModal = false;
  }

  confirmBulkDelete() {
    if (this.selectedPaperIds.size === 0 || this.isDeleting) return;
    
    this.isDeleting = true;
    const paperIds = Array.from(this.selectedPaperIds);
    const count = paperIds.length;

    // Delete all selected papers in parallel
    const deleteObservables = paperIds.map(id => 
      this.paperService.deletePaper(id)
    );

    forkJoin(deleteObservables).subscribe({
      next: () => {
        this.toastr.success(`${count} paper${count > 1 ? 's' : ''} deleted successfully`);
        this.selectedPaperIds.clear();
        this.loadPapers();
        this.loadStats();
        this.closeDeleteConfirmModal();
        this.isDeleting = false;
      },
      error: (err) => {
        console.error('Failed to delete papers:', err);
        this.toastr.error('Some papers could not be deleted');
        this.isDeleting = false;
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

  toggleFavorite(paperId: string, isFavorite: boolean) {
    if (isFavorite) {
      this.favoriteService.removeFavorite(paperId).subscribe({
        next: () => {
          const paper = this.papers.find(p => p._id === paperId);
          if (paper) {
            paper.isFavorite = false;
            this.applyFilter();
          }
          this.toastr.success('Removed from favorites');
        },
        error: (err) => {
          console.error('Failed to remove favorite:', err);
          this.toastr.error('Failed to remove from favorites');
        }
      });
    } else {
      this.favoriteService.addFavorite(paperId).subscribe({
        next: () => {
          const paper = this.papers.find(p => p._id === paperId);
          if (paper) {
            paper.isFavorite = true;
            this.applyFilter();
          }
          this.toastr.success('Added to favorites');
        },
        error: (err) => {
          console.error('Failed to add favorite:', err);
          this.toastr.error('Failed to add to favorites');
        }
      });
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

  getTagDisplayName(tagName: string | null): string {
    if (!tagName) return '';
    const tag = this.tags.find(t => t.name === tagName);
    return tag?.displayName || tagName;
  }

  getThreatModelDisplayName(threatModelName: string | null): string {
    if (!threatModelName) return '';
    const threatModel = this.threatModels.find(tm => tm.name === threatModelName);
    return threatModel?.displayName || threatModelName;
  }

  // Export functionality
  exportToBibTeX() {
    if (this.filteredPapers.length === 0) {
      this.toastr.warning('No papers to export');
      return;
    }

    let bibtex = '';
    this.filteredPapers.forEach((paper, index) => {
      const key = `paper${index + 1}_${paper.year || 'unknown'}`;
      const title = paper.title?.replace(/[{}]/g, '') || 'Untitled';
      const authors = paper.authors?.replace(/[{}]/g, '') || 'Unknown';
      const venue = paper.venue?.replace(/[{}]/g, '') || '';
      const year = paper.year || '';
      const url = paper.link || '';

      bibtex += `@inproceedings{${key},\n`;
      bibtex += `  title={${title}},\n`;
      bibtex += `  author={${authors}},\n`;
      if (venue) bibtex += `  booktitle={${venue}},\n`;
      if (year) bibtex += `  year={${year}},\n`;
      if (url) bibtex += `  url={${url}},\n`;
      bibtex += `}\n\n`;
    });

    this.downloadFile(bibtex, 'papers.bib', 'text/plain');
    this.toastr.success(`Exported ${this.filteredPapers.length} papers to BibTeX`);
  }

  exportToCSV() {
    if (this.filteredPapers.length === 0) {
      this.toastr.warning('No papers to export');
      return;
    }

    const headers = ['Title', 'Authors', 'Venue', 'Year', 'Link', 'Reading Status', 'Tags', 'Threat Models', 'Key Findings'];
    const rows = this.filteredPapers.map(paper => {
      const tags = paper.tags?.map(t => this.getTagDisplayName(t)).join('; ') || '';
      const threatModels = paper.sok?.threatModel?.map(tm => this.getThreatModelDisplayName(tm)).join('; ') || '';
      const keyFindings = paper.sok?.keyFindings?.replace(/"/g, '""') || '';
      
      return [
        `"${paper.title?.replace(/"/g, '""') || ''}"`,
        `"${paper.authors?.replace(/"/g, '""') || ''}"`,
        `"${paper.venue?.replace(/"/g, '""') || ''}"`,
        paper.year || '',
        paper.link || '',
        paper.readingStatus || '',
        `"${tags}"`,
        `"${threatModels}"`,
        `"${keyFindings}"`
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    this.downloadFile(csv, 'papers.csv', 'text/csv');
    this.toastr.success(`Exported ${this.filteredPapers.length} papers to CSV`);
  }

  exportToJSON() {
    if (this.filteredPapers.length === 0) {
      this.toastr.warning('No papers to export');
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      totalPapers: this.filteredPapers.length,
      papers: this.filteredPapers.map(paper => ({
        title: paper.title,
        authors: paper.authors,
        venue: paper.venue,
        year: paper.year,
        link: paper.link,
        readingStatus: paper.readingStatus,
        tags: paper.tags?.map(t => {
          const tag = this.tags.find(tag => tag.name === t);
          return { name: tag?.name || t, displayName: tag?.displayName || t };
        }) || [],
        threatModels: paper.sok?.threatModel?.map(tm => {
          const threatModel = this.threatModels.find(tmObj => tmObj.name === tm);
          return { name: threatModel?.name || tm, displayName: threatModel?.displayName || tm };
        }) || [],
        sok: paper.sok,
        createdAt: paper.createdAt,
        createdBy: paper.createdBy
      }))
    };

    const json = JSON.stringify(exportData, null, 2);
    this.downloadFile(json, 'papers.json', 'application/json');
    this.toastr.success(`Exported ${this.filteredPapers.length} papers to JSON`);
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

