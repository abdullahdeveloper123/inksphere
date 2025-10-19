import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { marked } from "marked";
import "@/App.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, MessageCircle, Search, Edit, LogOut, User, PlusCircle } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Auth Context
const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setUser(res.data)).catch(() => logout());
    }
  }, [token]);

  return { token, user, login, logout, setUser };
};

// Auth Page Component
const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const data = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;
      
      const response = await axios.post(`${API}${endpoint}`, data);
      onLogin(response.data.access_token);
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>InkSpace</h1>
          <p>Share your thoughts with the world</p>
        </div>
        
        <div className="auth-tabs">
          <button 
            className={isLogin ? 'active' : ''}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={!isLogin ? 'active' : ''}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <Input
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
              data-testid="register-username-input"
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            data-testid="auth-email-input"
          />
          <Input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            data-testid="auth-password-input"
          />
          <Button type="submit" className="auth-submit" data-testid="auth-submit-button">
            {isLogin ? 'Login' : 'Create Account'}
          </Button>
        </form>
      </div>
    </div>
  );
};

// Navigation Component
const Navigation = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-content">
        <h1 className="nav-logo" onClick={() => navigate('/')}>InkSpace</h1>
        
        <form onSubmit={handleSearch} className="nav-search">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="search-input"
          />
        </form>

        <div className="nav-actions">
          <Button onClick={() => navigate('/create')} className="nav-button" data-testid="create-blog-button">
            <PlusCircle size={18} />
            Write
          </Button>
          <Button onClick={() => navigate('/profile')} variant="ghost" className="nav-icon" data-testid="profile-button">
            <User size={20} />
          </Button>
          <Button onClick={onLogout} variant="ghost" className="nav-icon" data-testid="logout-button">
            <LogOut size={20} />
          </Button>
        </div>
      </div>
    </nav>
  );
};

// Blog Card Component
const BlogCard = ({ blog, onFavorite }) => {
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(blog.is_favorited);
  const [favCount, setFavCount] = useState(blog.favorites_count);

  const handleFavorite = async (e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/blogs/${blog.id}/favorite`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsFavorited(response.data.favorited);
      setFavCount(prev => response.data.favorited ? prev + 1 : prev - 1);
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const getPreview = (content) => {
    const plainText = content.replace(/[#*`\[\]()]/g, '');
    return plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
  };

  return (
    <Card className="blog-card" onClick={() => navigate(`/blog/${blog.id}`)} data-testid="blog-card">
      <CardHeader className="blog-card-header">
        <div className="blog-author">
          <Avatar className="author-avatar">
            <AvatarImage src={blog.profile_pic ? `${BACKEND_URL}/uploads/${blog.profile_pic}` : ''} />
            <AvatarFallback>{blog.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="author-name">{blog.username}</div>
            <div className="blog-date">{new Date(blog.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h2 className="blog-title">{blog.title}</h2>
        <p className="blog-preview">{getPreview(blog.content)}</p>
        
        <div className="blog-actions">
          <button 
            className={`action-button ${isFavorited ? 'favorited' : ''}`}
            onClick={handleFavorite}
            data-testid="favorite-button"
          >
            <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
            <span data-testid="favorites-count">{favCount}</span>
          </button>
          <button className="action-button">
            <MessageCircle size={18} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

// Home Page
const HomePage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/blogs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlogs(response.data);
    } catch (error) {
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page" data-testid="home-page">
      <div className="page-header">
        <h2>Discover Stories</h2>
        <p>Explore the most saved blogs from our community</p>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : blogs.length === 0 ? (
        <div className="empty-state">
          <p>No blogs yet. Be the first to share your story!</p>
        </div>
      ) : (
        <div className="blog-grid">
          {blogs.map(blog => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      )}
    </div>
  );
};

// Search Page
const SearchPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) {
      searchBlogs();
    }
  }, [query]);

  const searchBlogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/blogs/search?keyword=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlogs(response.data);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="page-header">
        <h2>Search Results for "{query}"</h2>
        <p>{blogs.length} blog(s) found</p>
      </div>

      {loading ? (
        <div className="loading">Searching...</div>
      ) : blogs.length === 0 ? (
        <div className="empty-state">
          <p>No blogs found matching your search.</p>
        </div>
      ) : (
        <div className="blog-grid">
          {blogs.map(blog => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      )}
    </div>
  );
};

// Create Blog Page with WYSIWYG Editor
const CreateBlogPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const editorRef = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/blogs`,
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Blog published successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to publish blog');
    }
  };

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    updateContent();
  };

  const updateContent = () => {
    const editor = document.querySelector('[data-testid="wysiwyg-editor"]');
    if (editor) {
      // Convert HTML back to markdown
      const html = editor.innerHTML;
      const markdown = htmlToMarkdown(html);
      setContent(markdown);
    }
  };

  const htmlToMarkdown = (html) => {
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    let markdown = '';
    
    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        const text = Array.from(node.childNodes).map(processNode).join('');
        
        switch(tagName) {
          case 'h1': return `\n# ${text}\n`;
          case 'h2': return `\n## ${text}\n`;
          case 'h3': return `\n### ${text}\n`;
          case 'strong':
          case 'b': return `**${text}**`;
          case 'em':
          case 'i': return `*${text}*`;
          case 'code': return `\`${text}\``;
          case 'blockquote': return `\n> ${text}\n`;
          case 'ul': 
            return '\n' + Array.from(node.children).map(li => 
              `- ${Array.from(li.childNodes).map(processNode).join('')}`
            ).join('\n') + '\n';
          case 'ol': 
            return '\n' + Array.from(node.children).map((li, idx) => 
              `${idx + 1}. ${Array.from(li.childNodes).map(processNode).join('')}`
            ).join('\n') + '\n';
          case 'a': 
            return `[${text}](${node.getAttribute('href') || 'url'})`;
          case 'br': return '\n';
          case 'p': return text + '\n\n';
          case 'div': 
            // Handle centered text
            if (node.style.textAlign === 'center') {
              return `<div style="text-align: center;">${text}</div>\n`;
            }
            return text + '\n';
          default: return text;
        }
      }
      return '';
    };
    
    return Array.from(temp.childNodes).map(processNode).join('').trim();
  };

  const wrapSelectedText = (tagName) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const selectedContent = range.extractContents();
      const wrapper = document.createElement(tagName);
      wrapper.appendChild(selectedContent);
      range.insertNode(wrapper);
      
      // Clear selection and update content
      selection.removeAllRanges();
      updateContent();
    }
  };

  const applyAlignment = (alignment) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const selectedContent = range.extractContents();
      const wrapper = document.createElement('div');
      wrapper.style.textAlign = alignment;
      wrapper.appendChild(selectedContent);
      range.insertNode(wrapper);
      
      // Clear selection and update content
      selection.removeAllRanges();
      updateContent();
    }
  };

  const formatButtons = [
    { icon: 'B', label: 'Bold', action: () => applyFormat('bold'), style: 'font-bold' },
    { icon: 'I', label: 'Italic', action: () => applyFormat('italic'), style: 'italic' },
    { icon: 'H1', label: 'Heading 1', action: () => wrapSelectedText('h1') },
    { icon: 'H2', label: 'Heading 2', action: () => wrapSelectedText('h2') },
    { icon: 'H3', label: 'Heading 3', action: () => wrapSelectedText('h3') },
    { icon: '•', label: 'Bullet List', action: () => applyFormat('insertUnorderedList') },
    { icon: '1.', label: 'Numbered List', action: () => applyFormat('insertOrderedList') },
    { icon: '""', label: 'Quote', action: () => wrapSelectedText('blockquote') },
    { icon: '⊏⊐', label: 'Center', action: () => applyAlignment('center') },
    { icon: '<>', label: 'Code', action: () => wrapSelectedText('code') },
    { icon: 'Link', label: 'Link', action: () => {
      const url = prompt('Enter URL:');
      if (url) applyFormat('createLink', url);
    }},
  ];

  return (
    <div className="create-page" data-testid="create-blog-page">
      <div className="create-header">
        <h2>Write Your Story</h2>
        <div className="create-actions">
          <Button onClick={handleSubmit} data-testid="publish-button">Publish</Button>
        </div>
      </div>

      <form className="create-form">
        <Input
          placeholder="Blog title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="title-input"
          required
          data-testid="blog-title-input"
        />
        
        <div className="editor-toolbar">
          {formatButtons.map((btn, idx) => (
            <button
              key={idx}
              type="button"
              className={`toolbar-btn ${btn.style || ''}`}
              onClick={btn.action}
              title={btn.label}
              data-testid={`format-${btn.label.toLowerCase().replace(' ', '-')}`}
            >
              {btn.icon}
            </button>
          ))}
        </div>

        <div
          ref={editorRef}
          contentEditable
          className="wysiwyg-editor markdown-content"
          onInput={updateContent}
          onBlur={updateContent}
          data-testid="wysiwyg-editor"
          suppressContentEditableWarning
        >
          <p className="placeholder-text">Start writing your story... Select text and use the toolbar buttons to format.</p>
        </div>
      </form>
    </div>
  );
};

// Blog Detail Page
const BlogDetailPage = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlog();
    fetchComments();
  }, [id]);

  const fetchBlog = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlog(response.data);
    } catch (error) {
      toast.error('Failed to load blog');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API}/blogs/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to load comments');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/blogs/${id}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      fetchComments();
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleFavorite = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/blogs/${id}/favorite`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBlog(prev => ({
        ...prev,
        is_favorited: response.data.favorited,
        favorites_count: response.data.favorited ? prev.favorites_count + 1 : prev.favorites_count - 1
      }));
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!blog) return null;

  return (
    <div className="blog-detail" data-testid="blog-detail-page">
      <article className="blog-article">
        <header className="article-header">
          <h1 className="article-title">{blog.title}</h1>
          <div className="article-meta">
            <div className="blog-author">
              <Avatar>
                <AvatarImage src={blog.profile_pic ? `${BACKEND_URL}/uploads/${blog.profile_pic}` : ''} />
                <AvatarFallback>{blog.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="author-name">{blog.username}</div>
                <div className="blog-date">{new Date(blog.created_at).toLocaleDateString()}</div>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleFavorite}
              className={blog.is_favorited ? 'favorited' : ''}
              data-testid="detail-favorite-button"
            >
              <Heart size={18} fill={blog.is_favorited ? 'currentColor' : 'none'} />
              <span data-testid="detail-favorites-count">{blog.favorites_count}</span>
            </Button>
          </div>
        </header>

        <div 
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: marked(blog.content) }}
          data-testid="blog-content"
        />
      </article>

      <section className="comments-section">
        <h3 className="comments-title">Comments ({comments.length})</h3>
        
        <form onSubmit={handleAddComment} className="comment-form">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            data-testid="comment-textarea"
          />
          <Button type="submit" data-testid="comment-submit-button">Post Comment</Button>
        </form>

        <div className="comments-list">
          {comments.map(comment => (
            <div key={comment.id} className="comment" data-testid="comment-item">
              <Avatar className="comment-avatar">
                <AvatarImage src={comment.profile_pic ? `${BACKEND_URL}/uploads/${comment.profile_pic}` : ''} />
                <AvatarFallback>{comment.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{comment.username}</span>
                  <span className="comment-date">{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
                <p className="comment-text">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// Profile Page
const ProfilePage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [userBlogs, setUserBlogs] = useState([]);
  const [activeTab, setActiveTab] = useState('blogs');

  useEffect(() => {
    if (user) {
      fetchUserBlogs();
    }
  }, [user]);

  const fetchUserBlogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/${user.id}/blogs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserBlogs(response.data);
    } catch (error) {
      console.error('Failed to load user blogs');
    }
  };

  const handleUpdateBio = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/users/me`,
        { bio },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(prev => ({ ...prev, bio }));
      setEditMode(false);
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/users/upload-image?image_type=${type}`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      // Refetch user data to get the updated profile
      const userResponse = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userResponse.data);
      
      toast.success('Image uploaded');
      
      // Reset file input to allow uploading the same file again
      e.target.value = '';
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-page" data-testid="profile-page">
      <div className="profile-header">
        <div className="banner-container">
          <div 
            className="profile-banner"
            style={{
              backgroundImage: user.banner_pic 
                ? `url(${BACKEND_URL}/uploads/${user.banner_pic})` 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            <label className="upload-overlay" data-testid="banner-upload-label">
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleImageUpload(e, 'banner')}
                data-testid="banner-upload-input"
              />
              <Edit size={20} />
            </label>
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-avatar-container">
            <Avatar className="profile-avatar">
              <AvatarImage src={user.profile_pic ? `${BACKEND_URL}/uploads/${user.profile_pic}` : ''} />
              <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <label className="avatar-edit" data-testid="profile-pic-upload-label">
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleImageUpload(e, 'profile')}
                data-testid="profile-pic-upload-input"
              />
              <Edit size={16} />
            </label>
          </div>

          <div className="profile-details">
            <h2 className="profile-username">{user.username}</h2>
            <p className="profile-email">{user.email}</p>
            
            {editMode ? (
              <div className="bio-edit">
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  data-testid="bio-textarea"
                />
                <div className="bio-actions">
                  <Button onClick={handleUpdateBio} data-testid="save-bio-button">Save</Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="bio-display">
                <p className="profile-bio">{user.bio || 'No bio yet'}</p>
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)} data-testid="edit-bio-button">
                  <Edit size={14} /> Edit Bio
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          <button 
            className={activeTab === 'blogs' ? 'active' : ''}
            onClick={() => setActiveTab('blogs')}
          >
            My Blogs ({userBlogs.length})
          </button>
        </div>

        <div className="blog-grid">
          {userBlogs.length === 0 ? (
            <div className="empty-state">
              <p>You haven't written any blogs yet.</p>
              <Button onClick={() => navigate('/create')}>Write Your First Blog</Button>
            </div>
          ) : (
            userBlogs.map(blog => (
              <BlogCard key={blog.id} blog={blog} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const { token, user, login, logout, setUser } = useAuth();

  if (!token) {
    return <AuthPage onLogin={login} />;
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Navigation user={user} onLogout={logout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/create" element={<CreateBlogPage />} />
            <Route path="/blog/:id" element={<BlogDetailPage />} />
            <Route path="/profile" element={<ProfilePage user={user} setUser={setUser} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;