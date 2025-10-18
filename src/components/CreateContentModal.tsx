import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContentEditor } from "@/components/ContentEditor";
import { toast } from "sonner";

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateContentModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateContentModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (content: {
    text: string;
    media: any[];
    tags?: string[];
  }) => {
    setIsSubmitting(true);
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 这里会调用真实的API
      console.log("Submitting content:", content);
      
      toast.success("内容发布成功！");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("发布失败，请重试");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建新内容</DialogTitle>
        </DialogHeader>
        
        <ContentEditor
          onSubmit={handleSubmit}
          onCancel={onClose}
          placeholder="分享你的精彩时刻..."
          maxLength={500}
          allowMedia={true}
        />
      </DialogContent>
    </Dialog>
  );
};