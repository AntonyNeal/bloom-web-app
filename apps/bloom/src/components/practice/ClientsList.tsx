/**
 * Clients List - BLOOM Design System
 * Miyazaki-inspired client management for practitioners
 */

import { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Mail, Phone, Calendar } from 'lucide-react';
import { Card } from '@/components/ui';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { useToast } from '@/hooks';
import api from '@/services/api';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  created_at: string;
  imported_from_halaxy: boolean;
}

interface ClientsListProps {
  practitionerId: string;
  onSelectClient?: (client: Client) => void;
  onCreateClient?: () => void;
}

export function ClientsList({ practitionerId, onSelectClient, onCreateClient }: ClientsListProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadClients();
  }, [practitionerId]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<{ clients: Client[] }>(
        `/clients?practitioner_id=${practitionerId}${searchTerm ? `&search=${searchTerm}` : ''}`
      );
      setClients(data.clients);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load clients',
        description: 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchTerm !== undefined) {
        loadClients();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const getDisplayName = (client: Client) => {
    if (client.preferred_name) return client.preferred_name;
    return `${client.first_name} ${client.last_name}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-bloom-sage border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-bloom-forest">Your Clients</h2>
          <p className="text-sm text-bloom-moss mt-1">
            {clients.length} {clients.length === 1 ? 'client' : 'clients'}
          </p>
        </div>
        <Button
          onClick={onCreateClient}
          className="bg-bloom-sage hover:bg-bloom-fern transition-all duration-300"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bloom-moss" />
        <Input
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="pl-10 bg-bloom-cream border-bloom-stone focus:border-bloom-sage transition-colors"
        />
      </div>

      {/* Clients Grid */}
      <AnimatePresence mode="popLayout">
        {clients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bloom-cream flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-bloom-sage" />
            </div>
            <h3 className="text-lg font-medium text-bloom-forest mb-2">No clients yet</h3>
            <p className="text-sm text-bloom-moss mb-6">
              {searchTerm ? 'Try a different search term' : 'Add your first client to get started'}
            </p>
            {!searchTerm && (
              <Button
                onClick={onCreateClient}
                variant="outline"
                className="border-bloom-sage text-bloom-sage hover:bg-bloom-sage hover:text-white transition-all duration-300"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add First Client
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client: Client, index: number) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card
                  onClick={() => onSelectClient?.(client)}
                  className="p-4 cursor-pointer border-bloom-stone hover:border-bloom-sage transition-all duration-300 hover:shadow-md bg-white"
                >
                  {/* Client Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-bloom-forest truncate">
                        {getDisplayName(client)}
                      </h3>
                      {client.preferred_name && (
                        <p className="text-xs text-bloom-moss">
                          {client.first_name} {client.last_name}
                        </p>
                      )}
                    </div>
                    {client.imported_from_halaxy && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-bloom-cream text-bloom-sage border border-bloom-stone">
                        Imported
                      </span>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {client.email && (
                      <div className="flex items-center text-xs text-bloom-moss">
                        <Mail className="w-3 h-3 mr-2 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center text-xs text-bloom-moss">
                        <Phone className="w-3 h-3 mr-2 flex-shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.date_of_birth && (
                      <div className="flex items-center text-xs text-bloom-moss">
                        <Calendar className="w-3 h-3 mr-2 flex-shrink-0" />
                        <span>DOB: {formatDate(client.date_of_birth)}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-bloom-stone">
                    <p className="text-xs text-bloom-moss">
                      Added {formatDate(client.created_at)}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
