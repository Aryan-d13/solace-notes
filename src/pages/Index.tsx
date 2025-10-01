import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Book } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DiaryEntryCard } from "@/components/DiaryEntryCard";
import { NewEntryDialog } from "@/components/NewEntryDialog";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadEntries(session.user.id);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadEntries(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadEntries = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading entries",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleEntryCreated = () => {
    if (user) {
      loadEntries(user.id);
    }
    setShowNewEntry(false);
  };

  const handleEntryDeleted = (entryId: string) => {
    setEntries(entries.filter(entry => entry.id !== entryId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <Book className="h-16 w-16 mx-auto text-primary animate-float" />
          <p className="text-muted-foreground font-serif">Loading your diary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl md:text-6xl font-handwritten text-primary mb-2">
              My Diary
            </h1>
            <p className="text-muted-foreground font-serif">
              A space for your thoughts and reflections
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hover:bg-secondary/50"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Entries */}
        <div className="space-y-6">
          {entries.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <p className="text-2xl font-handwritten text-muted-foreground">
                Your diary is waiting for its first entry
              </p>
              <p className="text-muted-foreground font-serif">
                Click the + button to begin your journey
              </p>
            </div>
          ) : (
            entries.map((entry, index) => (
              <DiaryEntryCard 
                key={entry.id} 
                entry={entry}
                onDeleted={handleEntryDeleted}
                style={{ animationDelay: `${index * 0.1}s` }}
                className="animate-slide-up"
              />
            ))
          )}
        </div>

        {/* Floating Action Button */}
        <Button
          size="lg"
          className="fixed bottom-8 right-8 rounded-full h-16 w-16 shadow-[var(--shadow-float)] hover:shadow-[var(--shadow-soft)] transition-all duration-300 hover:scale-110"
          onClick={() => setShowNewEntry(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* New Entry Dialog */}
        <NewEntryDialog
          open={showNewEntry}
          onOpenChange={setShowNewEntry}
          onEntryCreated={handleEntryCreated}
          userId={user?.id || ""}
        />
      </div>
    </div>
  );
};

export default Index;