'use client';

import { useState } from 'react';
import { Button, Input, Card, CardContent, CardHeader } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface Item {
  id: number;
  name: string;
}

interface GenericManagerProps {
  title: string;
  items: Item[];
  onCreate: (name: string) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (id: number, name: string) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: number) => Promise<{ success: boolean; error?: string }>;
}

export default function GenericManager({
  title,
  items,
  onCreate,
  onUpdate,
  onDelete,
}: GenericManagerProps) {
  const { addToast } = useToast();
  const [newItemName, setNewItemName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setIsSubmitting(true);
    const result = await onCreate(newItemName);
    setIsSubmitting(false);

    if (result.success) {
      addToast('Elemento creado correctamente', 'success');
      setNewItemName('');
    } else {
      addToast(result.error || 'Error al crear', 'error');
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) return;

    setIsSubmitting(true);
    const result = await onUpdate(id, editingName);
    setIsSubmitting(false);

    if (result.success) {
      addToast('Actualizado correctamente', 'success');
      setEditingId(null);
    } else {
      addToast(result.error || 'Error al actualizar', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;

    const result = await onDelete(id);
    if (result.success) {
      addToast('Eliminado correctamente', 'success');
    } else {
      addToast(result.error || 'Error al eliminar', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Agrega {title}</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-4">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`Nombre de ${title}`}
              className="flex-1"
            />
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Agregar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Listado de {title}</h2>
              <span className="text-sm text-muted-foreground">
                {filteredItems.length} de {items.length}
              </span>
            </div>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay elementos registrados.
              </p>
            ) : filteredItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay resultados para la busqueda.
              </p>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-md group"
                >
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-4">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-9"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(item.id)}
                        isLoading={isSubmitting}
                      >
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <span className="font-medium">{item.name}</span>
                  )}

                  {editingId !== item.id && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditingName(item.name);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
