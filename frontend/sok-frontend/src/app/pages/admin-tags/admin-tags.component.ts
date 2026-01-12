import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { TagService, Tag } from '../../services/tag.service';
import { AuthService } from '../../services/auth.service';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-admin-tags',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, NotificationBellComponent, ThemeToggleComponent],
  templateUrl: './admin-tags.component.html',
  styleUrl: './admin-tags.component.css'
})
export class AdminTagsComponent implements OnInit {
  private tagService = inject(TagService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  
  currentUser$ = this.authService.currentUser$;

  tags: Tag[] = [];
  selectedTag: Tag | null = null;
  showEditModal = false;
  showAddModal = false;
  loading = false;
  selectedTagIds: Set<string> = new Set();
  showDeleteConfirmModal = false;
  isDeleting = false;
  showPapersUsingTagModal = false;
  papersUsingTag: Array<{ _id: string; title: string }> = [];
  tagToDelete: Tag | null = null;

  // Form fields
  tagName = '';
  tagDisplayName = '';
  tagDescription = '';
  tagColor = '#3b82f6';

  ngOnInit() {
    this.loadTags();
  }

  loadTags() {
    this.tagService.getTags().subscribe({
      next: (response) => {
        this.tags = response.tags;
      },
      error: (err) => {
        console.error('Failed to load tags:', err);
        this.toastr.error('Failed to load tags');
      }
    });
  }

  openAddModal() {
    this.tagName = '';
    this.tagDisplayName = '';
    this.tagDescription = '';
    this.tagColor = '#3b82f6';
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  openEditModal(tag: Tag) {
    this.selectedTag = tag;
    this.tagName = tag.name;
    this.tagDisplayName = tag.displayName;
    this.tagDescription = tag.description || '';
    this.tagColor = tag.color || '#3b82f6';
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedTag = null;
  }

  addTag() {
    if (!this.tagName.trim()) {
      this.toastr.error('Tag name is required');
      return;
    }

    this.loading = true;
    const tagData = {
      name: this.tagName.trim(),
      displayName: this.tagDisplayName.trim() || this.tagName.trim(),
      description: this.tagDescription.trim(),
      color: this.tagColor
    };

    this.tagService.createTag(tagData).subscribe({
      next: () => {
        this.loadTags();
        this.closeAddModal();
        this.loading = false;
        this.toastr.success('Tag created successfully');
      },
      error: (err) => {
        console.error('Failed to create tag:', err);
        this.toastr.error(err.error?.message || 'Failed to create tag');
        this.loading = false;
      }
    });
  }

  updateTag() {
    if (!this.selectedTag || !this.tagDisplayName.trim()) {
      this.toastr.error('Display name is required');
      return;
    }

    this.loading = true;
    const tagData = {
      displayName: this.tagDisplayName.trim(),
      description: this.tagDescription.trim(),
      color: this.tagColor
    };

    this.tagService.updateTag(this.selectedTag._id, tagData).subscribe({
      next: () => {
        this.loadTags();
        this.closeEditModal();
        this.loading = false;
        this.toastr.success('Tag updated successfully');
      },
      error: (err) => {
        console.error('Failed to update tag:', err);
        this.toastr.error(err.error?.message || 'Failed to update tag');
        this.loading = false;
      }
    });
  }

  deleteTag(tag: Tag) {
    // Try to delete - backend will return papers using this tag if any
    this.tagService.deleteTag(tag._id).subscribe({
      next: () => {
        this.loadTags();
        this.toastr.success('Tag deleted successfully');
      },
      error: (err) => {
        console.error('Failed to delete tag:', err);
        if (err.status === 400 && err.error?.papersUsingTag && err.error.papersUsingTag.length > 0) {
          // Show modal with papers using this tag
          this.tagToDelete = tag;
          this.papersUsingTag = err.error.papersUsingTag;
          this.showPapersUsingTagModal = true;
        } else {
          this.toastr.error(err.error?.message || 'Failed to delete tag');
        }
      }
    });
  }

  closePapersUsingTagModal() {
    this.showPapersUsingTagModal = false;
    this.papersUsingTag = [];
    this.tagToDelete = null;
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
        // Even if logout fails, clear local state and redirect
        this.router.navigate(['/login']);
      }
    });
  }

  toggleTagSelection(tagId: string) {
    if (this.selectedTagIds.has(tagId)) {
      this.selectedTagIds.delete(tagId);
    } else {
      this.selectedTagIds.add(tagId);
    }
  }

  isTagSelected(tagId: string): boolean {
    return this.selectedTagIds.has(tagId);
  }

  toggleSelectAll() {
    if (this.isAllSelected()) {
      this.selectedTagIds.clear();
    } else {
      this.selectedTagIds.clear();
      this.tags.forEach(tag => {
        this.selectedTagIds.add(tag._id);
      });
    }
  }

  isAllSelected(): boolean {
    if (this.tags.length === 0) return false;
    return this.tags.every(tag => this.selectedTagIds.has(tag._id));
  }

  isSomeSelected(): boolean {
    return this.selectedTagIds.size > 0 && !this.isAllSelected();
  }

  getSelectedCount(): number {
    return this.selectedTagIds.size;
  }

  openDeleteConfirmModal() {
    if (this.selectedTagIds.size === 0) return;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal() {
    this.showDeleteConfirmModal = false;
  }

  confirmBulkDelete() {
    if (this.selectedTagIds.size === 0 || this.isDeleting) return;
    
    this.isDeleting = true;
    const tagIds = Array.from(this.selectedTagIds);
    const count = tagIds.length;

    const deleteObservables = tagIds.map(id => 
      this.tagService.deleteTag(id)
    );

    forkJoin(deleteObservables).subscribe({
      next: () => {
        this.toastr.success(`${count} tag${count > 1 ? 's' : ''} deleted successfully`);
        this.selectedTagIds.clear();
        this.loadTags();
        this.closeDeleteConfirmModal();
        this.isDeleting = false;
      },
      error: (err) => {
        console.error('Failed to delete tags:', err);
        this.toastr.error('Some tags could not be deleted');
        this.isDeleting = false;
      }
    });
  }
}

