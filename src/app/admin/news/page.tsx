"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Image as ImageIcon, ExternalLink, Newspaper } from "lucide-react";
import type { NewsPost, ApiResponse } from "@/lib/types";

export default function NewsAdminPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/news?includeUnpublished=true");
      const result = await response.json() as ApiResponse<NewsPost[]>;
      
      if (result.success && result.data) {
        // Konvertera datum från strängar till Date-objekt
        const postsWithDates = result.data.map(post => ({
          ...post,
          publishedAt: post.publishedAt instanceof Date ? post.publishedAt : new Date(post.publishedAt),
          createdAt: post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt),
          updatedAt: post.updatedAt instanceof Date ? post.updatedAt : new Date(post.updatedAt),
        }));
        setPosts(postsWithDates);
      }
    } catch (error) {
      console.error("Error fetching news posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPost = async (postData: Partial<NewsPost>) => {
    try {
      const response = await fetch("/api/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json() as ApiResponse<NewsPost>;
      
      if (result.success && result.data) {
        // Konvertera datum till Date-objekt
        const newPost = {
          ...result.data,
          publishedAt: result.data.publishedAt instanceof Date ? result.data.publishedAt : new Date(result.data.publishedAt),
          createdAt: result.data.createdAt instanceof Date ? result.data.createdAt : new Date(result.data.createdAt),
          updatedAt: result.data.updatedAt instanceof Date ? result.data.updatedAt : new Date(result.data.updatedAt),
        };
        setPosts([newPost, ...posts]);
        setShowAddForm(false);
        alert('✅ Nyhetsinlägg tillagt!');
      } else {
        alert('❌ Kunde inte lägga till inlägg: ' + (result.error || 'Okänt fel'));
      }
    } catch (error) {
      console.error("Error adding news post:", error);
      alert('❌ Nätverksfel: ' + (error instanceof Error ? error.message : 'Okänt fel'));
    }
  };

  const handleTogglePublished = async (post: NewsPost) => {
    try {
      const newIsPublished = !post.isPublished;
      
      const response = await fetch("/api/news", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: post.id,
          isPublished: newIsPublished
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json() as ApiResponse<NewsPost>;
      
      if (result.success && result.data) {
        // Konvertera datum till Date-objekt
        const updatedPost = {
          ...result.data,
          publishedAt: result.data.publishedAt instanceof Date ? result.data.publishedAt : new Date(result.data.publishedAt),
          createdAt: result.data.createdAt instanceof Date ? result.data.createdAt : new Date(result.data.createdAt),
          updatedAt: result.data.updatedAt instanceof Date ? result.data.updatedAt : new Date(result.data.updatedAt),
        };
        setPosts(prevPosts => 
          prevPosts.map(p => p.id === post.id ? updatedPost : p)
        );
        alert('✅ Inlägg uppdaterat!');
      } else {
        alert('❌ Kunde inte uppdatera inlägg: ' + (result.error || 'Okänt fel'));
      }
    } catch (error) {
      console.error("Error updating news post:", error);
      alert('❌ Nätverksfel: ' + (error instanceof Error ? error.message : 'Okänt fel'));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm("Är du säker på att du vill ta bort detta nyhetsinlägg?")) {
      try {
        const response = await fetch(`/api/news?id=${postId}`, {
          method: "DELETE",
        });

        const result = await response.json() as ApiResponse<{ message: string }>;
        
        if (result.success) {
          setPosts(posts.filter(p => p.id !== postId));
          alert('✅ Inlägg borttaget!');
        } else {
          alert('❌ Kunde inte ta bort inlägg: ' + (result.error || 'Okänt fel'));
        }
      } catch (error) {
        console.error("Error deleting news post:", error);
        alert('❌ Nätverksfel: ' + (error instanceof Error ? error.message : 'Okänt fel'));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Laddar nyhetsinlägg...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Hantera Nyheter</h1>
                <p className="text-gray-600">Administrera nyheter och pressmeddelanden</p>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Lägg till nyhet
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide mb-2">Totalt inlägg</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{posts.length}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide mb-2">Publicerade</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">
                {posts.filter(p => p.isPublished).length}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide mb-2">Opublicerade</p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                {posts.filter(p => !p.isPublished).length}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide mb-2">Med bilder</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                {posts.filter(p => p.imageUrl).length}
              </p>
            </div>
          </div>

          {/* Posts List */}
          <div className="bg-white rounded-lg border border-gray-200">
            {posts.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">Inga nyhetsinlägg ännu</p>
                <p className="text-sm text-gray-400 mt-2">
                  Lägg till ditt första inlägg för att komma igång.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {posts.map((post) => (
                  <div key={post.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900">{post.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium self-start ${
                            post.isPublished 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {post.isPublished ? "Publicerad" : "Opublicerad"}
                          </span>
                        </div>
                        
                        {post.excerpt && (
                          <p className="text-gray-600 mb-3 text-sm sm:text-base">{post.excerpt}</p>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm mb-3">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(post.publishedAt).toLocaleDateString("sv-SE")}</span>
                          </div>
                          {post.imageUrl && (
                            <div className="flex items-center gap-2 text-gray-500">
                              <ImageIcon className="w-4 h-4" />
                              <span>Har bild</span>
                            </div>
                          )}
                          {post.externalLink && (
                            <div className="flex items-center gap-2 text-gray-500">
                              <ExternalLink className="w-4 h-4" />
                              <span>Extern länk</span>
                            </div>
                          )}
                        </div>

                        {post.imageUrl && (
                          <div className="mt-3">
                            <img 
                              src={post.imageUrl} 
                              alt={post.title}
                              className="max-w-xs h-32 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                        <button
                          onClick={() => handleTogglePublished(post)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title={post.isPublished ? "Gör opublicerad" : "Publicera"}
                        >
                          {post.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => setEditingPost(post)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Redigera"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Ta bort"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      <span>Skapad: {new Date(post.createdAt).toLocaleDateString("sv-SE")}</span>
                      {(() => {
                        const updatedAt = post.updatedAt instanceof Date ? post.updatedAt : new Date(post.updatedAt);
                        const createdAt = post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt);
                        return updatedAt.getTime() !== createdAt.getTime() && (
                          <span className="ml-4">Uppdaterad: {updatedAt.toLocaleDateString("sv-SE")}</span>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Post Form */}
          {showAddForm && (
            <NewsPostForm
              onSave={handleAddPost}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* Edit Post Form */}
          {editingPost && (
            <NewsPostForm
              post={editingPost}
              onSave={async (data) => {
                try {
                  const response = await fetch("/api/news", {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: editingPost.id,
                      ...data
                    }),
                  });

                  const result = await response.json() as ApiResponse<NewsPost>;
                  
                  if (result.success && result.data) {
                    // Konvertera datum till Date-objekt
                    const updatedPost = {
                      ...result.data,
                      publishedAt: result.data.publishedAt instanceof Date ? result.data.publishedAt : new Date(result.data.publishedAt),
                      createdAt: result.data.createdAt instanceof Date ? result.data.createdAt : new Date(result.data.createdAt),
                      updatedAt: result.data.updatedAt instanceof Date ? result.data.updatedAt : new Date(result.data.updatedAt),
                    };
                    setPosts(prevPosts => 
                      prevPosts.map(p => p.id === editingPost.id ? updatedPost : p)
                    );
                    setEditingPost(null);
                    alert('✅ Inlägg uppdaterat!');
                  } else {
                    alert('❌ Kunde inte uppdatera inlägg: ' + (result.error || 'Okänt fel'));
                  }
                } catch (error) {
                  console.error("Error updating news post:", error);
                  alert('❌ Nätverksfel: ' + (error instanceof Error ? error.message : 'Okänt fel'));
                }
              }}
              onCancel={() => setEditingPost(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// News Post Form Component
function NewsPostForm({ 
  post, 
  onSave, 
  onCancel 
}: { 
  post?: NewsPost; 
  onSave: (data: Partial<NewsPost>) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    title: post?.title || "",
    excerpt: post?.excerpt || "",
    content: post?.content || "",
    imageUrl: post?.imageUrl || "",
    externalLink: post?.externalLink || "",
    publishedAt: post?.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    isPublished: post?.isPublished ?? true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        publishedAt: new Date(formData.publishedAt),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {post ? "Redigera nyhetsinlägg" : "Lägg till nyhetsinlägg"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titel *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sammanfattning (förhandsvisning)</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={2}
              placeholder="Kort sammanfattning som visas i listan..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Innehåll *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={8}
              required
              placeholder="Huvudinnehållet..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bild-URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">URL till bild som ska visas med inlägget</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Extern länk (valfritt)</label>
            <input
              type="url"
              value={formData.externalLink}
              onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="https://example.com/article"
            />
            <p className="text-xs text-gray-500 mt-1">Om nyheten kommer från extern källa</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Publiceringsdatum</label>
              <input
                type="date"
                value={formData.publishedAt}
                onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div className="flex items-center pt-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Publicerad</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? "Sparar..." : post ? "Uppdatera" : "Skapa"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

