
import React, { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Bell, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Tipo para las noticias
interface News {
  id: string;
  title: string;
  content: string;
  date: string;
  important: boolean;
}

const AdminNews = () => {
  // Estado para las noticias (simulado)
  const [news, setNews] = useState<News[]>([
    {
      id: '1',
      title: 'Actualización de la plataforma',
      content: 'Hemos actualizado la plataforma con nuevas funcionalidades para mejorar la experiencia de usuario.',
      date: new Date(2024, 4, 5).toISOString(),
      important: true
    },
    {
      id: '2',
      title: 'Cambio de horario verano',
      content: 'A partir del 1 de junio comienza el horario de verano. Consulta los nuevos horarios en recepción.',
      date: new Date(2024, 4, 1).toISOString(),
      important: false
    }
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentNews, setCurrentNews] = useState<News | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    important: false
  });

  const handleOpenDialog = (newsItem?: News) => {
    if (newsItem) {
      setCurrentNews(newsItem);
      setFormData({
        title: newsItem.title,
        content: newsItem.content,
        important: newsItem.important
      });
    } else {
      setCurrentNews(null);
      setFormData({
        title: '',
        content: '',
        important: false
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveNews = () => {
    if (currentNews) {
      // Editar noticia existente
      setNews(news.map(item => 
        item.id === currentNews.id 
          ? { ...item, ...formData }
          : item
      ));
    } else {
      // Crear nueva noticia
      const newNews: News = {
        id: Math.random().toString(36).substr(2, 9),
        title: formData.title,
        content: formData.content,
        date: new Date().toISOString(),
        important: formData.important
      };
      setNews([newNews, ...news]);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteNews = (id: string) => {
    setNews(news.filter(item => item.id !== id));
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header superior con título */}
        <header className="bg-[#A4CB6A] text-white py-1 px-4 text-center">
          <h1 className="text-lg font-semibold">APLIUM APLICACIONES TELEMATICAS SL</h1>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Noticias</h1>
              <p className="text-gray-600">Gestión de noticias y comunicados</p>
            </div>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-[#A4CB6A] hover:bg-[#8FB75A]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva noticia
            </Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Bell className="mr-2 text-[#A4CB6A]" />
              Noticias y comunicados
            </h2>
            
            {news.length > 0 ? (
              <div className="space-y-4">
                {news.map((item) => (
                  <div key={item.id} className={`border rounded-md p-4 ${item.important ? 'border-[#A4CB6A] bg-[#A4CB6A]/5' : ''}`}>
                    <div className="flex justify-between">
                      <h3 className="font-medium">
                        {item.important && <span className="inline-block w-2 h-2 rounded-full bg-[#A4CB6A] mr-2"></span>}
                        {item.title}
                      </h3>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleOpenDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500"
                          onClick={() => handleDeleteNews(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-2">{item.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">
                No hay noticias. Crea una noticia para comenzar.
              </p>
            )}
          </div>
        </main>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentNews ? 'Editar noticia' : 'Nueva noticia'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Título</label>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">Contenido</label>
              <Textarea 
                id="content" 
                rows={5} 
                value={formData.content} 
                onChange={(e) => setFormData({...formData, content: e.target.value})}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="important"
                checked={formData.important}
                onChange={(e) => setFormData({...formData, important: e.target.checked})}
                className="rounded border-gray-300 text-[#A4CB6A] focus:ring-[#A4CB6A]"
              />
              <label htmlFor="important" className="text-sm font-medium">Marcar como importante</label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-[#A4CB6A] hover:bg-[#8FB75A]" onClick={handleSaveNews}>
              {currentNews ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNews;
