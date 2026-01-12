import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AdminService, SearchPaper } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { PaperService } from '../../services/paper.service';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-admin-paper-finder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, NotificationBellComponent, ThemeToggleComponent],
  templateUrl: './admin-paper-finder.component.html',
  styleUrl: './admin-paper-finder.component.css'
})
export class AdminPaperFinderComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  private paperService = inject(PaperService);
  
  currentUser$ = this.authService.currentUser$;

  searchQuery = '';
  maxResults = 50;
  searching = false;
  papers: SearchPaper[] = [];
  totalResults = 0;
  selectedPaper: SearchPaper | null = null;
  showAddModal = false;
  addingPaper = false;
  currentSearchSources: string[] = ['dblp', 'semantic', 'openalex', 'arxiv'];
  loadingSummary = false;
  paperSummary: { title: string; abstract: string | null; tldr: string | null } | null = null;
  showSummaryModal = false;

  // Collapsible sections state
  expandedSections = {
    whatIsTool: false,
    whyUseTool: false,
    howToUse: false
  };

  // Available search sources
  availableSources: Array<{ id: string; name: string; description: string; enabled?: boolean }> = [
    { id: 'dblp', name: 'DBLP', description: 'Computer Science Bibliography', enabled: true },
    { id: 'semantic', name: 'Semantic Scholar', description: 'AI summaries & citations', enabled: true },
    { id: 'openalex', name: 'OpenAlex', description: 'Open alternative to Google Scholar', enabled: true },
    { id: 'arxiv', name: 'arXiv', description: 'Preprints & recent papers', enabled: true },
    { id: 'crossref', name: 'Crossref', description: 'DOI validation & metadata', enabled: true }
  ];

  // Paper form fields
  paperForm: Partial<SearchPaper & { readingStatus: string; tags: string[]; sok: any }> = {
    readingStatus: 'TO_READ',
    tags: [],
    sok: {}
  };

  // Predefined search queries
  predefinedQueries = [
    'browser extension security',
    'web extension privacy',
    'malicious browser add-on',
    'Chrome extension vulnerability',
    'Firefox add-on security',
    'extension fingerprinting',
    'manifest v3 security',
    'extension supply chain',
    'browser extension malware'
  ];

  ngOnInit() {
    // Scroll to top when component loads
    window.scrollTo(0, 0);
    // Load available sources from settings
    this.loadAvailableSources();
    // Listen for source updates
    window.addEventListener('sources-updated', () => {
      this.loadAvailableSources();
    });
    // Auto-search with a default query on load
    this.searchQuery = 'browser extension security';
    this.search();
  }

  loadAvailableSources() {
    // For non-admin users, filter sources based on settings
    // Admin users see all sources but can still be restricted by backend
    // This is a frontend filter - backend should also enforce this
    if (!this.isSuperAdmin()) {
      // In a real implementation, you'd fetch from SettingsService
      // For now, we'll keep all sources visible but backend will handle filtering
    }
  }

  get enabledSources() {
    return this.availableSources.filter(s => s.enabled !== false);
  }

  search() {
    if (!this.searchQuery.trim()) {
      this.toastr.warning('Please enter a search query');
      return;
    }

    const enabledSourceIds = this.enabledSources.map(s => s.id);
    const validSources = this.currentSearchSources.filter(id => enabledSourceIds.includes(id));
    
    if (validSources.length === 0) {
      this.toastr.warning('Please select at least one enabled search source');
      return;
    }

    // Update currentSearchSources to only include enabled ones
    this.currentSearchSources = validSources;

    this.searching = true;
    this.papers = [];
    this.totalResults = 0;

    this.adminService.searchPapers(this.searchQuery.trim(), this.maxResults, this.currentSearchSources).subscribe({
      next: (response) => {
        this.papers = response.papers || [];
        this.totalResults = response.total || 0;
        this.searching = false;
        
        if (this.papers.length === 0) {
          this.toastr.info('No papers found for your search query');
        } else {
          const sourcesUsed = response.sources.join(', ');
          this.toastr.success(`Found ${this.papers.length} papers from ${sourcesUsed}`);
        }
      },
      error: (err) => {
        console.error('Multi-source search error:', err);
        this.toastr.error(err.error?.message || 'Failed to search');
        this.searching = false;
      }
    });
  }

  toggleSource(sourceId: string) {
    const index = this.currentSearchSources.indexOf(sourceId);
    if (index > -1) {
      this.currentSearchSources.splice(index, 1);
    } else {
      this.currentSearchSources.push(sourceId);
    }
  }

  isSourceSelected(sourceId: string): boolean {
    return this.currentSearchSources.includes(sourceId);
  }

  getSourceBadgeColor(source: string): string {
    const colors: Record<string, string> = {
      'DBLP': 'bg-blue-100 text-blue-800',
      'Semantic Scholar': 'bg-purple-100 text-purple-800',
      'OpenAlex': 'bg-green-100 text-green-800',
      'arXiv': 'bg-orange-100 text-orange-800',
      'Crossref': 'bg-indigo-100 text-indigo-800'
    };
    return colors[source] || 'bg-slate-100 text-slate-800';
  }

  getSummary(paper: SearchPaper) {
    // Check if paper has semanticScholarId
    if (!paper.semanticScholarId) {
      // Check if paper was found in Semantic Scholar sources
      const hasSemanticSource = (paper.sources || [paper.source]).some(s => 
        s.toLowerCase().includes('semantic')
      );
      
      if (hasSemanticSource) {
        this.toastr.warning('This paper was found in Semantic Scholar but no paper ID is available. The summary feature requires a valid Semantic Scholar paper ID.');
      } else {
        this.toastr.warning('Summary only available for papers found in Semantic Scholar database.');
      }
      return;
    }

    // Validate paperId format (Semantic Scholar IDs are typically SHA-1 hashes, 40 characters)
    if (paper.semanticScholarId.length < 10) {
      this.toastr.error('Invalid Semantic Scholar paper ID format.');
      return;
    }

    this.loadingSummary = true;
    // Encode the paperId to handle special characters
    const encodedPaperId = encodeURIComponent(paper.semanticScholarId);
    
    this.adminService.getSemanticScholarSummary(encodedPaperId).subscribe({
      next: (response) => {
        if (!response.summary || (!response.summary.tldr && !response.summary.abstract)) {
          this.toastr.warning('No summary or abstract available for this paper.');
          this.loadingSummary = false;
          return;
        }
        
        this.paperSummary = response.summary;
        this.showSummaryModal = true;
        this.loadingSummary = false;
      },
      error: (err) => {
        console.error('Get summary error:', err);
        let errorMessage = 'Failed to get summary';
        
        if (err.status === 404) {
          errorMessage = 'Summary not found. This paper may not exist in Semantic Scholar database or the paper ID is invalid.';
        } else if (err.status === 504) {
          errorMessage = 'Request timeout. Please try again later.';
        } else if (err.status === 0) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        
        this.toastr.error(errorMessage, 'Summary Error', {
          timeOut: 6000,
          positionClass: 'toast-top-right'
        });
        this.loadingSummary = false;
      }
    });
  }

  closeSummaryModal() {
    this.showSummaryModal = false;
    this.paperSummary = null;
  }

  toggleSection(section: 'whatIsTool' | 'whyUseTool' | 'howToUse') {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  usePredefinedQuery(query: string) {
    this.searchQuery = query;
    this.search();
  }

  selectPaper(paper: SearchPaper) {
    this.selectedPaper = paper;
    this.paperForm = {
      title: paper.title,
      authors: paper.authors,
      venue: paper.venue,
      year: paper.year,
      url: paper.url || undefined,
      readingStatus: 'TO_READ',
      tags: [],
      sok: {}
    };
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.selectedPaper = null;
    this.paperForm = {
      readingStatus: 'TO_READ',
      tags: [],
      sok: {}
    };
  }

  addPaper() {
    if (!this.paperForm.title || !this.paperForm.authors) {
      this.toastr.warning('Title and Authors are required');
      return;
    }

    this.addingPaper = true;

    // Get sources from selected paper
    const sources = this.selectedPaper?.sources || [this.selectedPaper?.source || 'UNKNOWN'];

    this.adminService.addPaperFromSearch(
      this.paperForm,
      this.searchQuery,
      sources
    ).subscribe({
      next: () => {
        this.toastr.success('Paper added successfully');
        this.closeAddModal();
        this.addingPaper = false;
        // Optionally reload papers list
        this.paperService.getPapers().subscribe();
      },
      error: (err) => {
        console.error('Add paper error:', err);
        const errorMessage = err.error?.message || 'Failed to add paper';
        if (err.status === 409 || err.error?.duplicate) {
          this.toastr.error(errorMessage, '', {
            timeOut: 5000,
            positionClass: 'toast-top-right'
          });
        } else {
          this.toastr.error(errorMessage);
        }
        this.addingPaper = false;
      }
    });
  }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}

