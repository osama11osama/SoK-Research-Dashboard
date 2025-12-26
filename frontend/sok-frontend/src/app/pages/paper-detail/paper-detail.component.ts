import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PaperService, Paper } from '../../services/paper.service';
import { NoteService, Note } from '../../services/note.service';
import { AuthService } from '../../services/auth.service';
import { TagService, Tag } from '../../services/tag.service';
import { ThreatModelService, ThreatModel } from '../../services/threat-model.service';
import { SettingsService } from '../../services/settings.service';
import { FavoriteService } from '../../services/favorite.service';

@Component({
  selector: 'app-paper-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './paper-detail.component.html',
  styleUrl: './paper-detail.component.css'
})
export class PaperDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private paperService = inject(PaperService);
  private noteService = inject(NoteService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private tagService = inject(TagService);
  private threatModelService = inject(ThreatModelService);
  private settingsService = inject(SettingsService);
  private favoriteService = inject(FavoriteService);

  paper: Paper | null = null;
  notes: Note[] = [];
  newNoteContent = '';
  settings$ = this.settingsService.settings$;
  newNoteVisibility: 'PRIVATE' | 'PUBLIC' = 'PUBLIC';
  loading = false;
  showNoteTemplates = false;
  
  // Note templates
  noteTemplates = {
    summary: `## Summary

**Main Contribution:**
- 

**Key Points:**
- 
- 
- 

**Methodology:**
- 

**Results:**
- `,
    keyFindings: `## Key Findings

**Finding 1:**
- Description: 
- Significance: 

**Finding 2:**
- Description: 
- Significance: 

**Finding 3:**
- Description: 
- Significance: `,
    critique: `## Critique

**Strengths:**
- 
- 

**Weaknesses:**
- 
- 

**Limitations:**
- 
- 

**Future Work:**
- 
- 

**Personal Notes:**
- `
  };
  router = inject(Router);
  showEditModal = false;
  editPaper: Partial<Paper> & { 
    sok: {
      category?: string;
      method?: string;
      threatModel?: string[];
      dataset?: string;
      keyFindings?: string;
      limitations?: string;
      reproducibility: {
        code?: string;
        data?: string;
      };
    };
  } = {
    sok: {
      category: '',
      method: '',
      threatModel: [],
      dataset: '',
      keyFindings: '',
      limitations: '',
      reproducibility: { code: '', data: '' }
    }
  };
  selectedTagIds: string[] = [];
  selectedThreatModelIds: string[] = [];
  newTagName = '';
  newThreatModelName = '';
  editing = false;
  
  // Tag and Threat Model data
  tags: Tag[] = [];
  threatModels: ThreatModel[] = [];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPaper(id);
      this.loadNotes(id);
    }
    this.loadTags();
    this.loadThreatModels();
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

  loadPaper(id: string) {
    this.paperService.getPaper(id).subscribe({
      next: (response) => {
        this.paper = response.paper;
      },
      error: (err) => {
        console.error('Failed to load paper:', err);
      }
    });
  }

  loadNotes(paperId: string) {
    this.noteService.getNotes(paperId).subscribe({
      next: (response) => {
        this.notes = response.notes;
      },
      error: (err) => {
        console.error('Failed to load notes:', err);
      }
    });
  }

  addNote() {
    if (!this.newNoteContent.trim() || !this.paper?._id) {
      return;
    }

    this.loading = true;
    this.noteService.createNote(this.paper._id, this.newNoteContent, this.newNoteVisibility).subscribe({
      next: () => {
        this.newNoteContent = '';
        this.loadNotes(this.paper!._id!);
        this.loading = false;
        this.toastr.success('Note added successfully');
      },
      error: (err) => {
        console.error('Failed to create note:', err);
        this.toastr.error(err.error?.message || 'Failed to add note');
        this.loading = false;
      }
    });
  }

  canAddNotes(): boolean {
    return this.authService.canAddNotes();
  }

  toggleFavorite() {
    if (!this.paper || !this.paper._id) return;
    
    const isFavorite = this.paper.isFavorite || false;
    if (isFavorite) {
      this.favoriteService.removeFavorite(this.paper._id).subscribe({
        next: () => {
          if (this.paper) {
            this.paper.isFavorite = false;
          }
          this.toastr.success('Removed from favorites');
        },
        error: (err) => {
          console.error('Failed to remove favorite:', err);
          this.toastr.error('Failed to remove from favorites');
        }
      });
    } else {
      this.favoriteService.addFavorite(this.paper._id).subscribe({
        next: () => {
          if (this.paper) {
            this.paper.isFavorite = true;
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

  applyTemplate(templateType: 'summary' | 'keyFindings' | 'critique') {
    this.newNoteContent = this.noteTemplates[templateType];
    this.toastr.info('Template applied');
  }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  openEditModal() {
    if (!this.paper) return;
    // Deep copy to avoid mutating the original paper
    const existingSok = this.paper.sok || {};
    this.editPaper = {
      ...this.paper,
      link: this.paper.link || '', // Ensure link is string (not undefined/null)
      sok: {
        category: existingSok.category || '',
        method: existingSok.method || '',
        threatModel: existingSok.threatModel ? [...existingSok.threatModel] : [],
        dataset: existingSok.dataset || '',
        keyFindings: existingSok.keyFindings || '',
        limitations: existingSok.limitations || '',
        reproducibility: existingSok.reproducibility ? { 
          code: existingSok.reproducibility.code || '', 
          data: existingSok.reproducibility.data || '' 
        } : { code: '', data: '' }
      }
    };
    
    // Map paper tags to tag IDs
    this.selectedTagIds = [];
    if (this.paper.tags && this.paper.tags.length > 0) {
      this.selectedTagIds = this.paper.tags
        .map(tagName => this.tags.find(t => t.name === tagName)?._id)
        .filter(id => id !== undefined) as string[];
    }
    
    // Map paper threat models to threat model IDs
    this.selectedThreatModelIds = [];
    if (existingSok.threatModel && existingSok.threatModel.length > 0) {
      this.selectedThreatModelIds = existingSok.threatModel
        .map(tmName => this.threatModels.find(tm => tm.name === tmName)?._id)
        .filter(id => id !== undefined) as string[];
    }
    
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editPaper = {
      sok: {
        category: '',
        method: '',
        threatModel: [],
        dataset: '',
        keyFindings: '',
        limitations: '',
        reproducibility: { code: '', data: '' }
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

  isTagSelected(tagId: string): boolean {
    return this.selectedTagIds.includes(tagId);
  }

  isThreatModelSelected(threatModelId: string): boolean {
    return this.selectedThreatModelIds.includes(threatModelId);
  }

  filterByTag(tagName: string) {
    this.router.navigate(['/app/papers'], { queryParams: { tag: tagName } });
  }

  filterByThreatModel(threatModelName: string) {
    this.router.navigate(['/app/papers'], { queryParams: { threatModel: threatModelName } });
  }

  updateReproducibilityCode(value: string) {
    if (!this.editPaper.sok.reproducibility) {
      this.editPaper.sok.reproducibility = { code: '', data: '' };
    }
    this.editPaper.sok.reproducibility.code = value;
  }

  updateReproducibilityData(value: string) {
    if (!this.editPaper.sok.reproducibility) {
      this.editPaper.sok.reproducibility = { code: '', data: '' };
    }
    this.editPaper.sok.reproducibility.data = value;
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

  updatePaper() {
    if (!this.paper?._id || !this.editPaper) return;

    // Get trimmed link value
    const trimmedLink = (this.editPaper.link || '').trim();
    let linkToSend: string | null = null;
    
    // If link is provided (not empty), validate and normalize it
    if (trimmedLink) {
      if (!this.validateUrl(trimmedLink)) {
        this.toastr.error('Please enter a valid URL (e.g., example.com or https://example.com)');
        return;
      }
      // Normalize URL (add https:// if missing)
      linkToSend = this.normalizeUrl(trimmedLink) || null;
    } else {
      // Explicitly set to empty string to signal deletion
      linkToSend = '';
    }

    // Get selected tag names
    const selectedTagNames = this.selectedTagIds
      .map(id => this.tags.find(t => t._id === id)?.name)
      .filter(name => name !== undefined) as string[];

    // Get selected threat model names
    const selectedThreatModelNames = this.selectedThreatModelIds
      .map(id => this.threatModels.find(tm => tm._id === id)?.name)
      .filter(name => name !== undefined) as string[];

    this.editing = true;
    const paperData: any = {
      title: this.editPaper.title,
      authors: this.editPaper.authors,
      venue: this.editPaper.venue,
      year: this.editPaper.year ? Number(this.editPaper.year) : undefined,
      readingStatus: this.editPaper.readingStatus,
      tags: selectedTagNames,
      sok: {
        ...this.editPaper.sok,
        threatModel: selectedThreatModelNames
      }
    };
    
    // Always include link field - empty string means delete, null/undefined means don't change
    paperData.link = linkToSend;

    this.paperService.updatePaper(this.paper._id, paperData).subscribe({
      next: (response) => {
        // Double-check: verify link is actually removed
        const updatedPaper = response.paper;
        if (linkToSend === '' && updatedPaper.link) {
          console.warn('Link was not removed, retrying...');
          // Retry deletion
          this.retryLinkDeletion();
          return;
        }
        
        this.paper = updatedPaper;
        this.closeEditModal();
        this.editing = false;
        this.toastr.success('Paper updated successfully');
        // Reload the paper to get updated data
        this.loadPaper(this.paper._id!);
      },
      error: (err) => {
        console.error('Failed to update paper:', err);
        if (err.status === 401) {
          this.toastr.error('Your session has expired. Please log in again.');
          this.authService.logout().subscribe({
            next: () => {
              this.router.navigate(['/login']);
            }
          });
        } else {
          this.toastr.error(err.error?.message || 'Failed to update paper');
        }
        this.editing = false;
      }
    });
  }

  getVisibilityIcon(visibility: string) {
    return visibility === 'PRIVATE' ? '🔒' : '🌐';
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
    this.editPaper.link = '';
    // Force change detection
    setTimeout(() => {
      // Ensure the field is cleared
      if (this.editPaper.link) {
        this.editPaper.link = '';
      }
    }, 0);
  }

  retryLinkDeletion() {
    if (!this.paper?._id) return;
    const paperData = { link: '' };
    this.paperService.updatePaper(this.paper._id, paperData).subscribe({
      next: (response) => {
        this.paper = response.paper;
        this.closeEditModal();
        this.editing = false;
        this.toastr.success('Paper updated successfully');
        this.loadPaper(this.paper._id!);
      },
      error: (err) => {
        console.error('Retry link deletion failed:', err);
        this.editing = false;
        this.toastr.error('Failed to remove link');
      }
    });
  }
}

