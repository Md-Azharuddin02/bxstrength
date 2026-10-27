import React, { useState, useEffect } from 'react';
import { BLOG_POSTS_DATA } from '../data/gymData';
import { BlogPost } from '../types';
import { VelocityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Clock, User, Tag, ArrowRight, X, Plus, BookOpen, CheckCircle2 } from 'lucide-react';

interface BlogViewProps {
  initialSelectedPostId?: string | null;
  onClearInitialPost?: () => void;
}

export const BlogView: React.FC<BlogViewProps> = ({ initialSelectedPostId, onClearInitialPost }) => {
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom user-published posts + static posts
  const [livePosts, setLivePosts] = useState<BlogPost[]>([]);
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Post Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Workouts');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState(user?.name || '');
  const [newImage, setNewImage] = useState('');

  const loadPosts = () => {
    const userPosts = VelocityAPI.getBlogPosts();
    // Combine user posts first, then default seed posts
    setLivePosts([...userPosts, ...BLOG_POSTS_DATA]);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (user?.name && !newAuthor) {
      setNewAuthor(user.name);
    }
  }, [user]);

  useEffect(() => {
    if (initialSelectedPostId && livePosts.length > 0) {
      const post = livePosts.find(p => p.id === initialSelectedPostId);
      if (post) {
        setSelectedPost(post);
      }
    }
  }, [initialSelectedPostId, livePosts]);

  const categories = ['All', 'Nutrition', 'Workouts', 'Mind & Body', 'Transformation'];

  const filteredPosts = livePosts.filter((post) => {
    const matchesCat = activeCategory === 'All' || post.category === activeCategory;
    const matchesQuery = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Please enter a title and main content for your short blog post.');
      return;
    }

    const created = VelocityAPI.addBlogPost({
      title: newTitle.trim(),
      category: newCategory,
      excerpt: newExcerpt.trim() || newContent.trim().slice(0, 120) + '...',
      content: newContent.trim(),
      author: newAuthor.trim() || user?.name || 'BxStrength Client',
      image: newImage.trim() || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800',
      readTime: `${Math.max(2, Math.ceil(newContent.split(' ').length / 150))} min read`
    });

    loadPosts();
    setShowPublishModal(false);

    // Reset Form
    setNewTitle('');
    setNewExcerpt('');
    setNewContent('');
    setNewImage('');

    setToastMsg(`Your article "${created.title}" is now LIVE on BxStrength!`);
    setTimeout(() => setToastMsg(null), 4500);
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen py-12 text-white font-sans border-b border-zinc-800">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18181b] border-l-4 border-emerald-500 text-white px-5 py-3.5 shadow-2xl rounded-r-lg flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wide">{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="ml-2 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#121214] text-white py-16 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[11px] font-black tracking-widest text-zinc-400 uppercase bg-zinc-900 border border-zinc-800 px-3.5 py-1 rounded-full inline-block mb-3">
              SCIENCE-BACKED INSIGHTS & CLIENT ARTICLES
            </span>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              BxStrength RESEARCH & BLOG
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mt-2 leading-relaxed">
              Explore scientific lifting protocols, nutrition guides, and real client transformation stories published live by our UK community.
            </p>
          </div>

          {/* Temporarily hidden from the Blog page UI.
          <button
            onClick={() => setShowPublishModal(true)}
            className="bg-white hover:bg-zinc-200 text-black font-black text-xs tracking-wider uppercase px-6 py-3.5 rounded-lg transition-all shadow-lg cursor-pointer flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>WRITE SHORT ARTICLE</span>
          </button>
          */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 pb-6 border-b border-zinc-800/80">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-md'
                    : 'bg-[#121214] text-zinc-400 hover:text-white border border-zinc-800/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search articles or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121214] border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="bg-[#121214] border border-zinc-800 hover:border-zinc-600 rounded-xl shadow-lg transition-all duration-300 group flex flex-col h-full overflow-hidden hover:-translate-y-1"
            >
              <div className="relative h-52 overflow-hidden bg-zinc-900">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-zinc-900/90 border border-zinc-700 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded">
                  {post.category}
                </div>
              </div>

              <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mb-2 font-semibold">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>

                  <h2 className="text-base font-extrabold text-white uppercase tracking-tight mb-2 group-hover:text-zinc-300 transition-colors leading-snug">
                    {post.title}
                  </h2>

                  <p className="text-xs text-zinc-400 leading-relaxed font-normal line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5 truncate max-w-[170px]">
                    <User className="w-3.5 h-3.5 text-emerald-400" /> {post.author}
                  </span>
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="text-xs font-black text-white hover:text-zinc-300 uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <span>READ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* ARTICLE READ MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-[#121214] border-0 sm:border border-zinc-800 w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl rounded-none sm:rounded-xl shadow-2xl overflow-y-auto flex flex-col my-0 sm:my-8 animate-in zoom-in-95">
            <div className="relative h-64 bg-zinc-900">
              <img
                src={selectedPost.image}
                alt={selectedPost.title}
                className="w-full h-full object-cover filter brightness-90"
              />
              <button
                onClick={() => {
                  setSelectedPost(null);
                  if (onClearInitialPost) onClearInitialPost();
                }}
                className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase">
                <Tag className="w-3.5 h-3.5" /> {selectedPost.category} — {selectedPost.date}
              </div>

              <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
                {selectedPost.title}
              </h2>

              <p className="text-xs text-zinc-400 font-bold border-b border-zinc-800 pb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-white" /> By {selectedPost.author} • {selectedPost.readTime}
              </p>

              <div className="text-xs text-zinc-300 leading-relaxed space-y-3 font-normal pt-2">
                <p className="font-semibold text-white text-sm">{selectedPost.excerpt}</p>
                <p className="whitespace-pre-line">{selectedPost.content}</p>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedPost(null);
                    if (onClearInitialPost) onClearInitialPost();
                  }}
                  className="bg-white hover:bg-zinc-200 text-black font-extrabold text-xs px-6 py-2.5 uppercase rounded-lg cursor-pointer"
                >
                  CLOSE ARTICLE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WRITE & PUBLISH SHORT BLOG MODAL */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
          <div className="bg-[#121214] border-0 sm:border border-zinc-800 rounded-none sm:rounded-xl p-4 sm:p-6 lg:p-8 max-w-xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto space-y-6 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" /> PUBLISH SHORT ARTICLE
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Share your fitness breakthroughs, workout tips, or nutrition advice live on BxStrength.
                </p>
              </div>
              <button
                onClick={() => setShowPublishModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishPost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How I Added 15kg to My Squat in 8 Weeks"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-600"
                  >
                    <option value="Workouts">Workouts & Lifting</option>
                    <option value="Nutrition">Nutrition & Diets</option>
                    <option value="Mind & Body">Mind & Recovery</option>
                    <option value="Transformation">Transformation Story</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name / Alias"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                  Short Excerpt / Summary
                </label>
                <input
                  type="text"
                  placeholder="A brief 1-sentence overview of your post..."
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                  Article Body / Content *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Write your short blog article content here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                  Cover Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2.5 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-black tracking-wider uppercase rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" /> PUBLISH LIVE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
