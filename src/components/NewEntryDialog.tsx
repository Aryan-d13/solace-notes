import { useState } from "react";
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

interface NewEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntryCreated: () => void;
  userId: string;
}

export const NewEntryDialog = ({
  open,
  onOpenChange,
  onEntryCreated,
  userId,
}: NewEntryDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

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
      // First, analyze the mood
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-mood",
        {
          body: { content },
        }
      );

      if (analysisError) {
        console.error("Analysis error:", analysisError);
      }

      // Save the entry with analysis results
      const { error: insertError } = await supabase.from("diary_entries").insert({
        user_id: userId,
        title: title.trim() || null,
        content: content.trim(),
        mood_emojis: analysisData?.emojis || [],
        sentiment_analysis: analysisData?.sentiment || null,
      });

      if (insertError) throw insertError;

      toast({
        title: "Entry saved",
        description: "Your thoughts have been captured.",
      });

      setTitle("");
      setContent("");
      onEntryCreated();
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
            New Entry
          </DialogTitle>
          <DialogDescription className="font-serif">
            Pour your thoughts onto these pages
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-serif">
              Title (optional)
            </Label>
            <Input
              id="title"
              placeholder="A title for this moment..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              className="font-handwritten text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content" className="font-serif">
              Your thoughts
            </Label>
            <Textarea
              id="content"
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
              Save Entry
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};