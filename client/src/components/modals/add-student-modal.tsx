import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentSchema } from "@shared/schema";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Camera, X } from "lucide-react";

const addStudentFormSchema = insertStudentSchema.extend({
  photo: z.any().optional(),
});

type AddStudentForm = z.infer<typeof addStudentFormSchema>;

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddStudentModal({ isOpen, onClose, onSuccess }: AddStudentModalProps) {
  const { toast } = useToast();
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: classes } = useQuery<any[]>({
    queryKey: ["/api/classes"],
  });

  const form = useForm<AddStudentForm>({
    resolver: zodResolver(addStudentFormSchema),
    defaultValues: {
      fullName: "",
      rollNumber: "",
      class: "",
      dateOfBirth: "",
      gender: "Male",
      parentName: "",
      parentPhone: "",
      rfidCardId: "",
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: AddStudentForm) => {
      const formData = new FormData();
      
      // Append form fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'photo' && value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Append photo if selected
      if (selectedPhoto) {
        formData.append('photo', selectedPhoto);
      }

      const response = await fetch("/api/students", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create student");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student has been created successfully",
      });
      form.reset();
      setSelectedPhoto(null);
      setPhotoPreview(null);
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create student",
        variant: "destructive",
      });
    },
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const onSubmit = (data: AddStudentForm) => {
    createStudentMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    setSelectedPhoto(null);
    setPhotoPreview(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="Enter student's full name"
                {...form.register("fullName")}
                data-testid="input-student-name"
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="rollNumber">Roll Number *</Label>
              <Input
                id="rollNumber"
                placeholder="Enter roll number"
                {...form.register("rollNumber")}
                data-testid="input-roll-number"
              />
              {form.formState.errors.rollNumber && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.rollNumber.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="class">Class *</Label>
              <Select
                value={form.watch("class")}
                onValueChange={(value) => form.setValue("class", value)}
              >
                <SelectTrigger data-testid="select-student-class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.name}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.class && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.class.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...form.register("dateOfBirth")}
                data-testid="input-date-of-birth"
              />
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={form.watch("gender") || ""}
                onValueChange={(value) => form.setValue("gender", value)}
              >
                <SelectTrigger data-testid="select-gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="parentName">Parent/Guardian Name</Label>
              <Input
                id="parentName"
                placeholder="Enter parent's name"
                {...form.register("parentName")}
                data-testid="input-parent-name"
              />
            </div>

            <div>
              <Label htmlFor="parentPhone">Contact Number</Label>
              <Input
                id="parentPhone"
                type="tel"
                placeholder="Enter phone number"
                {...form.register("parentPhone")}
                data-testid="input-parent-phone"
              />
            </div>

            <div>
              <Label htmlFor="rfidCardId">RFID Card ID</Label>
              <Input
                id="rfidCardId"
                placeholder="Enter RFID card number"
                {...form.register("rfidCardId")}
                data-testid="input-rfid-card"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <Label>Student Photo</Label>
            <div className="mt-2">
              {photoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Student preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                    data-testid="img-photo-preview"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                    onClick={removePhoto}
                    data-testid="button-remove-photo"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop photo here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                    data-testid="input-photo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    data-testid="button-choose-photo"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Choose Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel-student"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createStudentMutation.isPending}
              data-testid="button-save-student"
            >
              {createStudentMutation.isPending ? "Creating..." : "Create Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
