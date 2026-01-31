export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  status: 'Reading' | 'Planned' | 'Finished' | 'Dropped';
  
  source: 'Physical' | 'Kindle' | 'Humble Bundle' | 'Library' | 'Other'; 
  format: 'Novel' | 'Graphic Novel' | 'Magazine';
  
  progress: number; 
  rating: number;   
  vibe: string[];
  notes: string;
}