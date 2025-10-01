import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface EditEntryDialogProps {
  entry: {
    id: string;
    title?: string;
    content: string;
    user_id: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditEntryDialog = ({ entry, open, onOpenChange }: EditEntryDialogProps) => {
  const [title, setTitle] = useState(entry.title || "");
  const [content, setContent] = useState(entry.content);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setTitle(entry.title || "");
    setContent(entry.content);
  }, [entry]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please write something before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Re-analyze mood if content changed
      let analysisData = null;
      if (content !== entry.content) {
        const { data, error: analysisError } = await supabase.functions.invoke(
          "analyze-mood",
          {
            body: { content },
          }
        );

        if (analysisError) {
          console.error("Analysis error:", analysisError);
        }
        analysisData = data;
      }

      // Update the entry
      const updateData: any = {
        title: title.trim() || null,
        content: content.trim(),
      };

      if (analysisData) {
        updateData.mood_emojis = analysisData.emojis || [];
        updateData.sentiment_analysis = analysisData.sentiment || null;
      }

      const { error: updateError } = await supabase
        .from("diary_entries")
        .update(updateData)
        .eq("id", entry.id);

      if (updateError) throw updateError;

      toast({
        title: "Entry updated",
        description: "Your changes have been saved.",
      });

      onOpenChange(false);
      // Refresh the page to show updated entry
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-handwritten text-primary">
            Edit Entry
          </DialogTitle>
          <DialogDescription className="font-serif">
            Refine your thoughts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="font-serif">
              Title (optional)
            </Label>
            <Input
              id="edit-title"
              placeholder="A title for this moment..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              className="font-handwritten text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-content" className="font-serif">
              Your thoughts
            </Label>
            <Textarea
              id="edit-content"
              placeholder="What's on your mind today?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={saving}
              className="min-h-[300px] font-sans resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};