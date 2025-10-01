import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditEntryDialog } from "./EditEntryDialog";

interface DiaryEntryCardProps {
  entry: {
    id: string;
    title?: string;
    content: string;
    mood_emojis: string[];
    sentiment_analysis?: string;
    created_at: string;
    user_id: string;
  };
  onDeleted: (entryId: string) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const DiaryEntryCard = ({ entry, onDeleted, style, className }: DiaryEntryCardProps) => {
  const [showEdit, setShowEdit] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("diary_entries")
        .delete()
        .eq("id", entry.id);

      if (error) throw error;

      toast({
        title: "Entry deleted",
        description: "Your diary entry has been removed.",
      });
      onDeleted(entry.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card 
        className={`shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-float)] transition-all duration-300 border-none ${className}`}
        style={style}
      >
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {entry.mood_emojis && entry.mood_emojis.length > 0 && (
                <div className="text-2xl mb-2 space-x-1">
                  {entry.mood_emojis.map((emoji, i) => (
                    <span key={i}>{emoji}</span>
                  ))}
                </div>
              )}
              {entry.title && (
                <CardTitle className="text-2xl font-handwritten text-primary">
                  {entry.title}
                </CardTitle>
              )}
              <p className="text-sm text-muted-foreground font-serif">
                {format(new Date(entry.created_at), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEdit(true)}
                className="hover:bg-secondary/50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap font-sans leading-relaxed">
            {entry.content}
          </p>
          {entry.sentiment_analysis && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-serif italic text-muted-foreground">
                {entry.sentiment_analysis}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <EditEntryDialog
        entry={entry}
        open={showEdit}
        onOpenChange={setShowEdit}
      />
    </>
  );
};