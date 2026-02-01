import React, { useEffect, useState } from 'react'
import './index.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Reading')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ 
    title: '', 
    author: '', 
    sentiment: '',
    status: '',
    enjoyment: 0,
    emotionalImpact: 0,
    effort: 0,
    rereadPotential: 0,
    notes: '',
    currentPage: 0,
    totalPages: 0,
    coverUrl: '',
    series: '',
    seriesOrder: 1
  })
  const [editingBookId, setEditingBookId] = useState<string | null>(null)
  const [showDetailedRatings, setShowDetailedRatings] = useState(false)
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)
  const [progressUpdateBook, setProgressUpdateBook] = useState<any>(null)
  const [tempPage, setTempPage] = useState(0)
  const [sortBy, setSortBy] = useState('Newest'); // Options: Newest, Title, Progress%, Series
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<any>(null);

  // A helper to update the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Fetch Config (API Key + Sort Preference)
        // @ts-ignore
        const config = await window.api.getConfig()
        if (config) {
          if (config.apiKey) setApiKey(config.apiKey)
          if (config.sortBy) setSortBy(config.sortBy)
        }

        // 2. Fetch Books
        // @ts-ignore
        const savedBooks = await window.api.getBooks()
        // Ensure we have an array even if the file is empty/missing
        setBooks(Array.isArray(savedBooks) ? savedBooks : [])
        
      } catch (error) {
        console.error("Initialization failed:", error)
        // Fallback: Still try to get books even if config fails
        try {
          // @ts-ignore
          const savedBooks = await window.api.getBooks()
          setBooks(Array.isArray(savedBooks) ? savedBooks : [])
        } catch (innerError) {
          console.error("Total failure to load books:", innerError)
        }
      }
    }

    initializeApp()
  }, [])
  
  const [books, setBooks] = useState<any[]>([]) // List of books

  const handleSave = async () => {
    if (!formData.title) return

    const updatedBookData = {
        title: formData.title,
        author: formData.author,
        sentiment: formData.sentiment,
        status: formData.status || activeTab,
        enjoyment: formData.enjoyment,
        emotionalImpact: formData.emotionalImpact,
        effort: formData.effort,
        rereadPotential: formData.rereadPotential,
        notes: formData.notes,
        currentPage: formData.currentPage,
        totalPages: formData.totalPages,
        coverUrl: formData.coverUrl,
        series: formData.series,
        seriesOrder: formData.seriesOrder
      }

      if (editingBookId) {
        const updatedBooks = books.map(b => 
          b.id === editingBookId ? { ...b, ...updatedBookData } : b
        )
        setBooks(updatedBooks)
        // @ts-ignore
        await window.api.saveAllBooks(updatedBooks)
      } else {
        const newBook = { id: Date.now().toString(), ...updatedBookData }
        // @ts-ignore
        await window.api.saveBook(newBook)
        setBooks([...books, newBook])
      }

      // Reset everything
      setFormData({ 
        title: '', 
        author: '', 
        sentiment: '', 
        status: '', 
        enjoyment: 0, 
        emotionalImpact: 0, 
        effort: 0, 
        rereadPotential: 0,
        notes: '',
        currentPage: 0,
        totalPages: 0,
        coverUrl: '',
        series: '',
        seriesOrder: 1
      })
      setEditingBookId(null)
      setIsModalOpen(false)
    }

  const handleEdit = (book: any) => {
    setFormData({ title: book.title,
      author: book.author,
      sentiment: book.sentiment,
      status: book.status,
      enjoyment: book.enjoyment,
      emotionalImpact: book.emotionalImpact,
      effort: book.effort,
      rereadPotential: book.rereadPotential,
      notes: book.notes,
      currentPage: book.currentPage,
      totalPages: book.totalPages,
      coverUrl: book.coverUrl,
      series: book.series,
      seriesOrder: book.seriesOrder
    })
    setEditingBookId(book.id)
    setIsModalOpen(true)
  }

  // Manual styles to guarantee spacing and layout
  const sidebarStyle: React.CSSProperties = {
    width: '280px',
    height: '100vh',
    backgroundColor: '#020617',
    borderRight: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    position: 'fixed',
    left: 0,
    top: 0
  }

  const mainStyle: React.CSSProperties = {
    marginLeft: '280px',
    padding: '40px',
    flex: 1,
    backgroundColor: '#0f172a',
    minHeight: '100vh',    // Keeps the background full-height
    overflowY: 'auto',     // Enables vertical scrolling when content overflows
    height: '100vh'        // Caps the container at viewport height to force internal scroll
  }

  const buttonStyle = (tab: string): React.CSSProperties => ({
    display: 'block',
    width: '100%',
    padding: '15px',
    marginBottom: '15px',
    backgroundColor: activeTab === tab ? '#059669' : '#1e293b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    textAlign: 'left',
    fontWeight: 'bold',
    cursor: 'pointer'
  })

  const getStarStyle = (starIndex: number, currentRating: number) => {
    const isFull = currentRating >= starIndex;
    const isHalf = currentRating === starIndex - 0.5;

    return {
      fontSize: '24px',
      cursor: 'pointer',
      background: isHalf 
        ? 'linear-gradient(90deg, #fbbf24 50%, #334155 50%)' 
        : 'none',
      WebkitBackgroundClip: isHalf ? 'text' : 'unset',
      WebkitTextFillColor: isHalf ? 'transparent' : 'unset',
      color: isFull ? '#fbbf24' : (isHalf ? 'inherit' : '#334155'),
      border: 'none',
      padding: 0,
      marginRight: '4px',
      transition: 'transform 0.1s'
    };
  };

  const moveButtonStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid #334155',
    color: '#34d399',
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginRight: '8px',
    marginTop: '5px'
  }

  const modalOverlayStyle = (isOpen: boolean): React.CSSProperties => ({
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: isOpen ? 'flex' : 'none',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: isOpen ? 'all' : 'none' // Ensures the overlay can't "lock" the screen when closed
  })

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: '#1e293b',
    padding: '30px',
    borderRadius: '12px',
    width: '500px', // Increased from 400px
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    maxHeight: '90vh',
    overflowY: 'auto' // Handle long content gracefully
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    marginTop: '5px',
    marginBottom: '20px',
    borderRadius: '4px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: 'white',
    outline: 'none', // Remove default browser ring
  };

  const moveBook = (book: any, newStatus: string) => {
    if (newStatus === 'Finished' || newStatus === 'Dropped') {
      setFormData({ 
        title: book.title, 
        author: book.author, 
        sentiment: book.sentiment || '',
        status: newStatus,
        enjoyment: book.enjoyment,
        emotionalImpact: book.emotionalImpact,
        effort: book.effort,
        rereadPotential: book.rereadPotential,
        notes: book.notes,
        currentPage: book.currentPage,
        totalPages: book.totalPages,
        coverUrl: book.coverUrl,
        series: book.series,
        seriesOrder: book.seriesOrder
      })
      setEditingBookId(book.id)
      setIsModalOpen(true)
    } else {
      // Immediate move for non-rated transitions
      const updatedBooks = books.map(b => 
        b.id === book.id ? { ...b, status: newStatus } : b
      )
      setBooks(updatedBooks)
      // @ts-ignore
      window.api.saveAllBooks(updatedBooks)
    }
  }

  const StarRating = ({ label, value, name }: { label: string, value: number, name: string }) => {
    return (
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
          {label}: {value} Stars
        </label>
        <div style={{ display: 'flex' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <div key={star} style={{ position: 'relative', display: 'inline-block' }}>
              {/* The Star Icon */}
              <span style={getStarStyle(star, value)}>★</span>
              
              {/* Left half hit zone */}
              <div 
                onClick={() => setFormData(prev => ({ ...prev, [name]: star - 0.5 }))}
                style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', cursor: 'pointer' }} 
              />
              
              {/* Right half hit zone */}
              <div 
                onClick={() => setFormData(prev => ({ ...prev, [name]: star }))}
                style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', cursor: 'pointer' }} 
              />
            </div>
          ))}
          {/* Reset button to go back to 0 */}
          <button 
            onClick={() => setFormData(prev => ({ ...prev, [name]: 0 }))}
            style={{ background: 'none', border: 'none', color: '#475569', fontSize: '10px', marginLeft: '10px', cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>
      </div>
    );
  };

  const [isSearching, setIsSearching] = useState(false); 

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GOOGLE_BOOKS_KEY || '');

  // Google Books API Key - stored in .env for privacy purposes
  const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_KEY;

  const fetchBookMetadata = async () => {
    if (!formData.title || isSearching) return;
    setIsSearching(true);
    
    try {
      const query = encodeURIComponent(`intitle:${formData.title} ${formData.author ? 'inauthor:' + formData.author : ''}`);
      const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const volumeInfo = data.items[0].volumeInfo;
        
        // Potential data from API
        const apiAuthor = volumeInfo.authors ? volumeInfo.authors[0] : '';
        const thumbnail = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail;
        const pages = volumeInfo.pageCount || 0;
        const apiSeries = volumeInfo.seriesInfo?.volumeSeries?.[0]?.seriesId || "";
        const apiOrder = volumeInfo.seriesInfo?.volumeSeries?.[0]?.seriesBookIndex || 1;
        
        const secureThumbnail = thumbnail?.replace('http://', 'https://');
        
        setFormData(prev => ({ 
          ...prev, 
          // 1. Fill author only if currently empty
          author: prev.author || apiAuthor,
          
          // 2. Fill series only if currently empty
          series: prev.series || apiSeries,
          
          // 3. Always pull cover and pages as they are harder to find manually
          coverUrl: secureThumbnail || prev.coverUrl,
          totalPages: prev.totalPages || pages,
          
          // 4. Update order only if series was empty or if order is 1
          seriesOrder: prev.series ? prev.seriesOrder : apiOrder
        }));
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // When the user changes the dropdown, save it immediately
  const handleSortChange = async (newSort: string) => {
    setSortBy(newSort);
    try {
      // @ts-ignore
      await window.api.saveConfig({ apiKey, sortBy: newSort });
    } catch (err) {
      console.error("Failed to save sort preference:", err);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleBulkSave = async () => {
    if (!bulkText.trim()) return;

    const titles = bulkText.split('\n').map(t => t.trim()).filter(t => t !== '');
    
    const newBooks = titles.map(title => ({
      id: (Date.now() + Math.random()).toString(),
      title: title,
      author: '', // Changed from 'Unknown Author' to empty
      status: 'Planned',
      sentiment: '',
      enjoyment: 0,
      emotionalImpact: 0,
      effort: 0,
      rereadPotential: 0,
      notes: '',
      currentPage: 0,
      totalPages: 0,
      coverUrl: '',
      series: '',
      seriesOrder: 1
    }));

    const updatedBooks = [...books, ...newBooks];
    setBooks(updatedBooks);
    // @ts-ignore
    await window.api.saveAllBooks(updatedBooks);

    setBulkText('');
    setIsBulkModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', backgroundColor: '#0f172a', minHeight: '100vh' }}>
      
      {/* SIDEBAR */}
      <aside style={sidebarStyle}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ color: '#34d399', margin: 0, fontSize: '24px' }}>EftLog</h1>
          <p style={{ color: '#64748b', fontSize: '10px', marginTop: '5px' }}>PERSONAL CATALOG</p>
        </div>
        
        <nav>
          {['Reading', 'Planned', 'Finished', 'Dropped'].map((tab) => {
            // Calculate the count for this specific tab
            const count = books.filter(b => b.status === tab).length;

            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSearchQuery(''); // Reset search when switching shelves
                }}
                style={{
                  ...buttonStyle(tab),
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{tab}</span>
                <span style={{ 
                  fontSize: '12px', 
                  opacity: 0.8, 
                  backgroundColor: activeTab === tab ? 'rgba(255,255,255,0.2)' : '#0f172a',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Bottom: Version & Settings */}
        <div style={{ marginTop: 'auto', paddingBottom: '10px', color: '#475569', fontSize: '12px' }}>
          v0.1.0-alpha • bluefootednewt
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={mainStyle}>
        {isDeleteModalOpen && (
          <div style={modalOverlayStyle(isDeleteModalOpen)}>
            <div style={{ ...modalContentStyle, width: '350px', textAlign: 'center' }}>
              <h2 style={{ color: '#ef4444', marginTop: 0 }}>Delete Book?</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '25px' }}>
                Are you sure you want to remove <strong>{bookToDelete?.title}</strong>? This action cannot be undone.
              </p>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setBookToDelete(null);
                  }}
                  style={{ flex: 1, padding: '12px', borderRadius: '6px', backgroundColor: '#334155', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (bookToDelete) {
                      // @ts-ignore
                      await window.api.deleteBook(bookToDelete.id);
                      setBooks(prev => prev.filter(b => b.id !== bookToDelete.id));
                      setIsDeleteModalOpen(false);
                      setBookToDelete(null);
                    }
                  }}
                  style={{ flex: 1, padding: '12px', borderRadius: '6px', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {isBulkModalOpen && (
          <div style={modalOverlayStyle(isBulkModalOpen)}>
            <div style={{ ...modalContentStyle, width: '450px' }}>
              <h2 style={{ marginTop: 0, color: '#34d399' }}>Bulk Add Books</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '15px' }}>
                Enter book titles below (one per line). They will be added to your **Planned** shelf.
              </p>
              
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="A Study in Scarlet&#10;The Sign of Four&#10;The Adventures of Sherlock Holmes"
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: 'white',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '20px'
                }}
              />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setIsBulkModalOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '6px', backgroundColor: '#334155', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBulkSave}
                  style={{ flex: 1, padding: '12px', borderRadius: '6px', backgroundColor: '#10b981', color: '#020617', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Add {bulkText.split('\n').filter(t => t.trim()).length} Books
                </button>
              </div>
            </div>
          </div>
        )}

        {isSettingsOpen && (
          <div style={modalOverlayStyle(isSettingsOpen)}>
            <div style={{ ...modalContentStyle, width: '400px' }}>
              <h2 style={{ color: '#34d399', marginTop: 0 }}>Settings</h2>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                  Google Books API Key
                </label>
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)} 
                  style={inputStyle} 
                  placeholder="Paste your API key here..."
                />
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '-10px' }}>
                  Required for fetching book covers and metadata.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setIsSettingsOpen(false)} 
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', backgroundColor: '#334155', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  Close
                </button>
                <button 
                  onClick={async () => {
                    // If your bridge supports saving config:
                    // @ts-ignore
                    await window.api.saveConfig({ apiKey }); 
                    setIsSettingsOpen(false);
                  }} 
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', backgroundColor: '#10b981', color: '#020617', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', margin: 0 }}>{activeTab}</h2>
          
          {/* Wrap buttons in a container to keep them grouped together */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* NEW: Settings Button */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              style={{ 
                backgroundColor: '#1e293b', 
                color: '#34d399', 
                padding: '10px 15px', 
                borderRadius: '5px', 
                fontWeight: 'bold', 
                border: '1px solid #34d399', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ⚙ Settings
            </button>

            <button 
              onClick={() => setIsBulkModalOpen(true)}
              style={{ 
                backgroundColor: '#1e293b', 
                color: '#34d399', 
                padding: '10px 15px', 
                borderRadius: '5px', 
                fontWeight: 'bold', 
                border: '1px solid #34d399', 
                cursor: 'pointer' 
              }}
            >
              Bulk Add
            </button>

            <button 
              onClick={() => {
                setEditingBookId(null);
                setFormData({ 
                  title: '', author: '', sentiment: '', status: '', 
                  enjoyment: 0, emotionalImpact: 0, effort: 0, rereadPotential: 0, 
                  notes: '', currentPage: 0, totalPages: 0, coverUrl: '', 
                  series: '', seriesOrder: 1
                });
                setIsModalOpen(true);
              }} 
              style={{ 
                backgroundColor: '#10b981', 
                color: '#020617', 
                padding: '10px 20px', 
                borderRadius: '5px', 
                fontWeight: 'bold', 
                border: 'none',
                cursor: 'pointer'
              }}
            >
              + Add Book
            </button>
          </div>
        </div>

        {/* View Controls: Search & Sort */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px',
          marginBottom: '30px' 
        }}>
          
          {/* Search Bar */}
          <input 
            type="text"
            placeholder={`Search in ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: '8px',
              border: '1px solid #334155',
              backgroundColor: '#1e293b',
              color: 'white',
              fontSize: '14px'
            }}
          />

          {/* Sort Dropdown Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
              Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              style={{
                padding: '8px 12px 8px 12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                minWidth: '160px',
                appearance: 'none'
              }}
            >
              <option value="Newest">Date Added</option>
              <option value="Title">Title (A-Z)</option>
              <option value="Author">Author (A-Z)</option>
              <option value="Progress">Progress %</option>
              <option value="Series">Series</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
          {books
            .filter(b => b.status === activeTab)
            .filter(b => 
              b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              b.author.toLowerCase().includes(searchQuery.toLowerCase())
            ).sort((a, b) => {
              if (sortBy === 'Title') {
                return a.title.localeCompare(b.title);
              }
              if (sortBy === 'Author') {
                return a.author.localeCompare(b.author);
              }
              if (sortBy === 'Progress') {
                const progA = a.totalPages > 0 ? a.currentPage / a.totalPages : 0;
                const progB = b.totalPages > 0 ? b.currentPage / b.totalPages : 0;
                return progB - progA; // Highest progress first
              }
              if (sortBy === 'Series') {
                if (a.series === b.series) {
                  return a.seriesOrder - b.seriesOrder;
                }
                return (a.series || '').localeCompare(b.series || '');
              }
              // Default: 'Newest' (assuming ID is based on timestamp)
              return parseInt(b.id) - parseInt(a.id);
            })
            .map(book => (
            <div 
              key={book.id} 
              style={{ 
                backgroundColor: '#1e293b', 
                borderRadius: '8px', 
                border: '1px solid #334155', 
                position: 'relative',
                display: 'flex', // New flex layout
                overflow: 'hidden',
                minHeight: '180px'
              }}
            >

              {/* Left: Cover Art */}
              <div style={{ width: '110px', height: '176px', backgroundColor: '#0f172a', flexShrink: 0 }}>
                {book.coverUrl ? (
                  <img 
                    src={book.coverUrl} 
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    alt={book.title}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#334155', fontSize: '10px' }}>
                    No Cover
                  </div>
                )}
              </div>

              {/* Right: Content */}
              <div style={{ flex: 1, padding: '15px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '10px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{book.title}</h3>
                  
                  {/* Series Indicator: Below Title, Above Author */}
                  {book.series && (
                    <p style={{ 
                      margin: '0 0 5px 0', 
                      fontSize: '11px', 
                      color: '#34d399', 
                      fontWeight: 'bold',
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px' 
                    }}>
                      {book.series} {book.seriesOrder ? `— Vol. ${book.seriesOrder}` : ''}
                    </p>
                  )}
                  
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>{book.author}</p>
                </div>
              
                {/* Sentiment Badge */}
                {book.sentiment && (
                  <span style={{ 
                    fontSize: '10px', 
                    padding: '2px 8px', 
                    borderRadius: '10px', 
                    backgroundColor: '#334155',
                    color: book.sentiment === 'Loved' ? '#f472b6' : '#94a3b8',
                    display: 'inline-block', // Ensures it only takes required width
                    width: 'fit-content'
                  }}>
                    {book.sentiment}
                  </span>
                )}
                {/* Inside the book card, below the author/sentiment */}
                {activeTab === 'Finished' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', fontSize: '10px', color: '#64748b' }}>
                    <span>⭐ ENJ: {book.enjoyment}</span>
                    <span>❤️ EMO: {book.emotionalImpact}</span>
                    <span>💪 EFF: {book.effort}</span>
                    <span>🔄 RRD: {book.rereadPotential}</span>
                  </div>
                )}
                {/* The Delete Button */}
                {/* Right-aligned Ellipses Menu */}
                <div style={{ position: 'absolute', top: '10px', right: '10px' }} onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === book.id ? null : book.id)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#94a3b8', 
                      fontSize: '20px', 
                      cursor: 'pointer',
                      padding: '0 5px',
                      lineHeight: '1'
                    }}
                  >
                    ⋮
                  </button>

                  {openMenuId === book.id && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '25px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                      zIndex: 10,
                      minWidth: '100px',
                      overflow: 'hidden'
                    }}>
                      <button 
                        onClick={() => { handleEdit(book); setOpenMenuId(null); }}
                        style={{ 
                          display: 'block', width: '100%', padding: '10px', textAlign: 'left',
                          background: 'none', border: 'none', color: '#34d399', fontSize: '12px',
                          fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        ✎ EDIT
                      </button>
                      <button 
                        onClick={() => { 
                          setBookToDelete(book); 
                          setIsDeleteModalOpen(true); 
                          setOpenMenuId(null); 
                        }}
                        style={{ 
                          display: 'block', width: '100%', padding: '10px', textAlign: 'left',
                          background: 'none', border: 'none', color: '#ef4444', fontSize: '12px',
                          fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        🗑 DELETE
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '15px', borderTop: '1px solid #334155', paddingTop: '10px' }}>
                  {activeTab === 'Planned' && (
                    <button onClick={() => moveBook(book, 'Reading')} style={moveButtonStyle}>Start Reading →</button>
                  )}
                  {activeTab === 'Reading' && (
                    <button 
                      onClick={() => moveBook(book, 'Finished')} 
                      style={{ 
                        ...moveButtonStyle, 
                        // Highlight logic
                        border: book.currentPage >= book.totalPages && book.totalPages > 0 
                          ? '2px solid #34d399' 
                          : '1px solid #334155',
                        boxShadow: book.currentPage >= book.totalPages && book.totalPages > 0 
                          ? '0 0 10px rgba(52, 211, 153, 0.4)' 
                          : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      FINISH BOOK ✓
                    </button>
                  )}
                  {/* Add a "Drop" option for anything not already dropped */}
                  {activeTab !== 'Dropped' && activeTab !== 'Finished' && (
                    <button 
                      onClick={() => moveBook(book, 'Dropped')} 
                      style={{ 
                        ...moveButtonStyle, 
                        color: '#ef4444', 
                        borderColor: '#ef4444', // Red border
                        backgroundColor: 'transparent' 
                      }}
                    >
                      Drop
                    </button>
                  )}
                  {activeTab === 'Reading' && (
                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button 
                        onClick={() => {
                          setProgressUpdateBook(book);
                          setTempPage(book.currentPage || 0);
                          setIsProgressModalOpen(true);
                        }}
                        style={{ background: '#1e293b', border: '1px solid #334155', color: '#34d399', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold' }}
                      >
                        UPDATE PG
                      </button>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Pg {book.currentPage} / {book.totalPages}
                      </span>
                    </div>
                  )}
                  {/* NEW: Re-read logic for Finished books */}
                  {activeTab === 'Finished' && (
                    <button onClick={() => moveBook(book, 'Reading')} style={{ ...moveButtonStyle, color: '#60a5fa' }}>Re-Read</button>
                  )}
                </div>
              </div>
              
              {/* Progress Bar for Reading Tab */}
              {activeTab === 'Reading' && book.totalPages > 0 && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '4px', 
                  backgroundColor: '#334155', 
                  borderRadius: '0 0 8px 8px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${Math.min((book.currentPage / book.totalPages) * 100, 100)}%`, 
                    height: '100%', 
                    backgroundColor: '#10b981',
                    transition: 'width 0.5s ease-out' // The "animated" part
                  }} />
                </div>
              )}
            </div>
            
            
          ))}
          
          {/* Show placeholder only if the current tab is empty */}
          {books.filter(b => b.status === activeTab).length === 0 && (
            <p style={{ color: '#94a3b8' }}>Your {activeTab} shelf is currently empty.</p>
          )}
        </div>
      </main>

      {/* NEW: ADD BOOK MODAL */}
      <div style={modalOverlayStyle(isModalOpen)}>
        <div style={modalContentStyle}>
          {/* Conditional Heading Logic */}
          {/* NEW LOGIC: Only show 'Finalizing' if we are moving TO a new category */}
          {formData.status && formData.status !== activeTab ? (
            <p style={{ color: '#34d399', fontSize: '18px', marginBottom: '20px', fontWeight: 'bold' }}>
              Finalizing Entry: {formData.title}
            </p>
          ) : (
            <h2 style={{ marginTop: 0, color: '#34d399' }}>
              {editingBookId ? 'Edit Book' : 'Add New Book'}
            </h2>
          )}

          <label style={{ fontSize: '14px', color: '#94a3b8' }}>Book Title</label>
          <input name="title" value={formData.title} onChange={handleInputChange} style={inputStyle} placeholder="e.g. The Great Gatsby" />

          <label style={{ fontSize: '14px', color: '#94a3b8' }}>Author</label>
          <input name="author" value={formData.author} onChange={handleInputChange} style={inputStyle} placeholder="e.g. F. Scott Fitzgerald" />

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <div style={{ flex: 3 }}>
              <label style={{ fontSize: '12px', color: '#94a3b8' }}>Series Name</label>
              <input 
                name="series" 
                value={formData.series} 
                onChange={handleInputChange} 
                style={{ ...inputStyle, marginBottom: 0 }} 
                placeholder="e.g. Sherlock Holmes" 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#94a3b8' }}>Vol #</label>
              <input 
                type="number"
                name="seriesOrder" 
                value={formData.seriesOrder} 
                onChange={handleInputChange} 
                style={{ ...inputStyle, marginBottom: 0 }} 
              />
            </div>
          </div>

          {/* Inside the modal, after the Author input */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <button 
                onClick={fetchBookMetadata}
                disabled={isSearching} // Disable while searching
                type="button"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  backgroundColor: isSearching ? '#1e293b' : '#334155', 
                  color: isSearching ? '#64748b' : 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: isSearching ? 'not-allowed' : 'pointer', 
                  fontSize: '12px', 
                  fontWeight: 'bold' 
                }}
              >
                {isSearching ? '⏳ Searching...' : '🔍 Search for Book Data'}
              </button>
            </div>
            
            {formData.coverUrl && (
              <div style={{ width: '60px', height: '90px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #334155' }}>
                <img src={formData.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
              </div>
            )}
          </div>

          {(activeTab === 'Reading' || formData.status === 'Reading') && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Current Page</label>
                <input 
                  type="number" 
                  name="currentPage" 
                  value={formData.currentPage} 
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPage: parseInt(e.target.value) || 0 }))}
                  style={{ ...inputStyle, marginBottom: 0 }} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Total Pages</label>
                <input 
                  type="number" 
                  name="totalPages" 
                  value={formData.totalPages} 
                  onChange={(e) => setFormData(prev => ({ ...prev, totalPages: parseInt(e.target.value) || 0 }))}
                  style={{ ...inputStyle, marginBottom: 0 }} 
                />
              </div>
            </div>
          )}

          {/* 3. Sentiment Logic: Show if in Finished/Dropped OR if we are MOVING to Finished/Dropped */}
          {(activeTab === 'Finished' || activeTab === 'Dropped' || formData.status === 'Finished' || formData.status === 'Dropped') && (
            <>
              <label style={{ fontSize: '14px', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>
                Overall Sentiment
              </label>
              <select 
                name="sentiment" 
                value={formData.sentiment} 
                onChange={(e) => setFormData({...formData, sentiment: e.target.value})}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
              >
                <option value="">-- Select a Rating --</option>
                <option value="Loved">❤️ Loved</option>
                <option value="Liked">👍 Liked</option>
                <option value="Meh">😐 Meh</option>
                <option value="Not for me">❌ Not for me</option>
              </select>
              <button 
                onClick={() => setShowDetailedRatings(!showDetailedRatings)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#34d399', 
                  fontSize: '12px', 
                  cursor: 'pointer', 
                  padding: '10px 0',
                  fontWeight: 'bold' 
                }}
              >
                {showDetailedRatings ? '▼ Hide Detailed Ratings' : '▶ Show Detailed Ratings (Enjoyment, Effort, etc.)'}
              </button>

              {showDetailedRatings && (
                <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#0f172a', borderRadius: '8px' }}>
                  <StarRating label="Enjoyment" value={formData.enjoyment} name="enjoyment" />
                  <StarRating label="Emotional Impact" value={formData.emotionalImpact} name="emotionalImpact" />
                  <StarRating label="Effort Required" value={formData.effort} name="effort" />
                  <StarRating label="Reread Potential" value={formData.rereadPotential} name="rereadPotential" />
                </div>
              )}
              <div style={{ marginTop: '20px' }}>
                <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                  Personal Notes / Post-Mortem
                </label>
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Why was this effort-heavy? What stayed with you?"
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              onClick={() => {
                setIsModalOpen(false);
                setEditingBookId(null);
                setFormData({ title: '', author: '', sentiment: '', status: '' , enjoyment: 0, emotionalImpact: 0, effort: 0, rereadPotential: 0, notes: '', currentPage: 0, totalPages: 0, coverUrl: '', series: '', seriesOrder: 1});
              }}
              style={{ flex: 1, padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#334155', color: 'white' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              style={{ flex: 1, padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#10b981', color: '#020617', fontWeight: 'bold' }}
            >
              Save Book
            </button>
          </div>
        </div>
      </div>
      {/* QUICK PROGRESS MODAL */}
      {isProgressModalOpen && (
        <div style={modalOverlayStyle(isProgressModalOpen)}>
          <div style={{ ...modalContentStyle, width: '300px' }}>
            <h3 style={{ marginTop: 0, color: '#34d399' }}>Update Progress</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '15px' }}>
              {progressUpdateBook?.title}
            </p>
            
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Currently on Page:</label>
            <input 
              type="number"
              value={tempPage}
              onChange={(e) => setTempPage(parseInt(e.target.value) || 0)}
              style={inputStyle}
              autoFocus
            />
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setIsProgressModalOpen(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#334155', color: 'white' }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  const updatedBooks = books.map(b => 
                    b.id === progressUpdateBook.id ? { ...b, currentPage: tempPage } : b
                  );
                  setBooks(updatedBooks);
                  // @ts-ignore
                  await window.api.saveAllBooks(updatedBooks);
                  setIsProgressModalOpen(false);
                }}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#10b981', color: '#020617', fontWeight: 'bold' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App