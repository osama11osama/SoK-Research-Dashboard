import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaperService, Paper } from '../../services/paper.service';
import { NoteService, Note } from '../../services/note.service';
import { AuthService } from '../../services/auth.service';

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

  paper: Paper | null = null;
  notes: Note[] = [];
  newNoteContent = '';
  newNoteVisibility: 'PRIVATE' | 'PUBLIC' = 'PUBLIC';
  loading = false;
  router = inject(Router);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPaper(id);
      this.loadNotes(id);
    }
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
      },
      error: (err) => {
        console.error('Failed to create note:', err);
        this.loading = false;
      }
    });
  }

  canAddNotes(): boolean {
    return this.authService.canAddNotes();
  }

  getVisibilityIcon(visibility: string) {
    return visibility === 'PRIVATE' ? '🔒' : '🌐';
  }
}

