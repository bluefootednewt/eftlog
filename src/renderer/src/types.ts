export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  status: 'Reading' | 'Planned' | 'Finished' | 'Dropped';
  
  // Custom tracking for a QA-minded reader
  source: 'Physical' | 'Kindle' | 'Humble Bundle' | 'Library' | 'Other'; 
  format: 'Novel' | 'Graphic Novel' | 'Magazine'; // For your interest in 'Debug' and 'Lackadaisy'
  
  progress: number; 
  rating: number;   
  vibe: string[];   // e.g., "Cerebral", "Indie aesthetic"
  notes: string;
}