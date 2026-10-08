import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthManager } from './auth.manager';

export class NotesManager {
  private auth: AuthManager;
  private unsubscribeFolders: () => void = () => {};
  private unsubscribeNotes: () => void = () => {};

  constructor() {
    this.auth = new AuthManager();
  }

  initialize(): void {
    this.auth.initialize();
    this.setupAuthListener();
  }

  private setupAuthListener(): void {
    const unsubscribe = this.auth.getCurrentUser() 
      ? undefined 
      : onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            // User signed in - folders and notes will sync automatically
          } else {
            this.clearAllData();
          }
        });
    if (unsubscribe) this.unsubscribeFolders = unsubscribe;
  }

  private clearAllData(): void {
    this.unsubscribeFolders();
    this.unsubscribeNotes();
    // Reset would be handled by the NotesContext useEffect
  }

  async createNote(folderId?: string): Promise<string | null> {
    const user = this.auth.getCurrentUser();
    if (!user) return null;

    const notesPath = 'notes';
    const newId = 'id_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

    const newNote = {
      id: newId,
      userId: user.uid,
      folderId: folderId || '',
      title: 'Nueva nota',
      content: '',
      isPinned: false,
      isArchived: false,
      color: '#ffffff',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const path = `notes/${newId}`;
    try {
      await setDoc(doc(db, 'notes', newId), newNote);
      return newId;
    } catch (err) {
      console.error('Create note error:', err);
      return null;
    }
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    const path = `notes/${id}`;
    try {
      await updateDoc(doc(db, 'notes', id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Update note error:', err);
      throw err;
    }
  }

  async deleteNote(id: string, permanent = false): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    const path = `notes/${id}`;
    try {
      if (permanent) {
        await deleteDoc(doc(db, 'notes', id));
      } else {
        await updateDoc(doc(db, 'notes', id), {
          isArchived: true,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Delete note error:', err);
      throw err;
    }
  }

  restoreNote(id: string): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) return Promise.reject(new Error('User not authenticated'));

    const path = `notes/${id}`;
    return updateDoc(doc(db, 'notes', id), {
      isArchived: false,
      updatedAt: new Date().toISOString(),
    });
  }

  togglePinNote(id: string): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) return Promise.reject(new Error('User not authenticated'));

    return this.updateNote(id, { isPinned: true });
  }

  moveNoteToFolder(noteId: string, folderId: string): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) return Promise.reject(new Error('User not authenticated'));

    return this.updateNote(noteId, { folderId });
  }

  async createFolder(name: string, color?: string, icon?: string): Promise<string | null> {
    const user = this.auth.getCurrentUser();
    if (!user) return null;

    const newId = 'folder_' + Math.random().toString(36).substring(2, 8) + Date.now().toString(36);

    const newFolder = {
      id: newId,
      userId: user.uid,
      name: name.trim() || 'Nueva Carpeta',
      color: color || '#3b82f6',
      icon: icon || 'folder',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const path = `folders/${newId}`;
    try {
      await setDoc(doc(db, 'folders', newId), newFolder);
      return newId;
    } catch (err) {
      console.error('Create folder error:', err);
      return null;
    }
  }

  async updateFolder(id: string, name: string, color: string, icon: string): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    const path = `folders/${id}`;
    try {
      await updateDoc(doc(db, 'folders', id), {
        name: name.trim(),
        color,
        icon,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Update folder error:', err);
      throw err;
    }
  }

  async deleteFolder(id: string, moveNotesToRoot = true): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    const notesPath = 'notes';
    const foldersRef = collection(db, foldersPath);
    const notesQuery = query(foldersRef, where('folderId', '==', id));
    const snapshot = await getDoc(foldersQuery);

    if (moveNotesToRoot) {
      const notesToMove = snapshot.docs.map(doc => doc.id);
      for (const noteId of notesToMove) {
        await this.updateNote(noteId, { folderId: '' });
      }
    } else {
      const notesToDelete = snapshot.docs.map(doc => doc.id);
      for (const noteId of notesToDelete) {
        await this.deleteNote(noteId, true);
      }
    }

    const path = `folders/${id}`;
    try {
      await deleteDoc(doc(db, 'folders', id));
    } catch (err) {
      console.error('Delete folder error:', err);
      throw err;
    }
  }

  getUserFolders(): Folder[] {
    const user = this.auth.getCurrentUser();
    if (!user) return [];

    const foldersPath = 'folders';
    const foldersRef = collection(db, foldersPath);
    const foldersQuery = query(foldersRef, where('userId', '==', user.uid));

    const folderSnapshot = getDocs(foldersQuery);
    return folderSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Folder)).sort((a, b) => a.name.localeCompare(b.name));
  }
}

export interface Note {
  id: string;
  userId: string;
  folderId: string;
  title: string;
  content: string;
  isPinned: boolean;
  isArchived: boolean;
  color: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export const notesManager = new NotesManager();