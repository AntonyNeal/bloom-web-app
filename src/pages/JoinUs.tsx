import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/config/api";
import { QualificationCheck } from "@/components/common/QualificationCheck";
import { Sparkles } from "lucide-react";

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ahpra_registration: string;
  specializations: string[];
  experience_years: number;
  cover_letter: string;
}

export function JoinUs() {
  const { toast } = useToast();
  const [hasPassedQualificationCheck, setHasPassedQualificationCheck] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    ahpra_registration: "",
    specializations: [],
    experience_years: 0,
    cover_letter: "",
  });

  const [files, setFiles] = useState({
    cv: null as File | null,
    certificate: null as File | null,
    photo: null as File | null,
  });

  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange =
    (type: "cv" | "certificate" | "photo") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setFiles({ ...files, [type]: e.target.files[0] });
      }
    };

  const uploadFile = async (file: File, type: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_ENDPOINTS.upload}?type=${type}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }
    
    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Upload files
      const cv_url = files.cv ? await uploadFile(files.cv, "cv") : "";
      const certificate_url = files.certificate
        ? await uploadFile(files.certificate, "certificate")
        : "";
      const photo_url = files.photo
        ? await uploadFile(files.photo, "photo")
        : "";

      // Submit application
      const response = await fetch(API_ENDPOINTS.applications, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cv_url,
          certificate_url,
          photo_url,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Submission failed");
      }

      setSubmitted(true);
      toast({
        title: "Application submitted!",
        description: "We'll review your application and be in touch soon.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit application. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-sage-200 shadow-lg bg-white">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-success to-sage-600 rounded-full flex items-center justify-center shadow-md">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="font-display text-h1 text-text-primary">
                Application Submitted!
              </CardTitle>
              <CardDescription className="font-body text-body-lg text-text-secondary leading-loose">
                Thank you for your interest in joining Life Psychology Australia.
                We'll review your application and be in touch within 5 business
                days.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setHasPassedQualificationCheck(false);
                  setFormData({
                    first_name: "",
                    last_name: "",
                    email: "",
                    phone: "",
                    ahpra_registration: "",
                    specializations: [],
                    experience_years: 0,
                    cover_letter: "",
                  });
                  setFiles({ cv: null, certificate: null, photo: null });
                }}
                variant="outline"
                className="border-sage-300 text-sage-700 hover:bg-sage-50 font-display"
              >
                Submit Another Application
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show qualification check first
  if (!hasPassedQualificationCheck) {
    return (
      <QualificationCheck 
        onEligible={() => setHasPassedQualificationCheck(true)}
      />
    );
  }

  // Show application form after passing qualification check
  return (
    <div className="min-h-screen bg-cream-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-display-md text-text-primary mb-3">
            Join Our Team
          </h1>
          <p className="font-body text-body-lg text-text-secondary leading-loose">
            We're looking for exceptional psychologists who share our commitment
            to clinical excellence and compassionate care.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-sage-200 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="font-display text-h2 text-text-primary">
                Application Form
              </CardTitle>
              <CardDescription className="font-body text-body text-text-secondary">
                All fields marked with <span className="text-error">*</span> are required
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="font-display text-body-sm text-text-primary">
                  First Name <span className="text-error">*</span>
                </Label>
                <Input
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  placeholder="Jane"
                  className="border-sage-200 focus:border-sage-600 focus:ring-sage-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="font-display text-body-sm text-text-primary">
                  Last Name <span className="text-error">*</span>
                </Label>
                <Input
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  placeholder="Smith"
                  className="border-sage-200 focus:border-sage-600 focus:ring-sage-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-display text-body-sm text-text-primary">
                Email <span className="text-error">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="jane.smith@email.com"
                className="border-sage-200 focus:border-sage-600 focus:ring-sage-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="font-display text-body-sm text-text-primary">
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+61 400 000 000"
                className="border-sage-200 focus:border-sage-600 focus:ring-sage-600"
              />
            </div>

            {/* Professional Information */}
            <div className="space-y-2">
              <Label htmlFor="ahpra" className="font-display text-body-sm text-text-primary">
                AHPRA Registration Number <span className="text-error">*</span>
              </Label>
              <Input
                id="ahpra"
                required
                value={formData.ahpra_registration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ahpra_registration: e.target.value,
                  })
                }
                placeholder="PSY0001234567"
                className="border-sage-200 focus:border-sage-600 focus:ring-sage-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience" className="font-display text-body-sm text-text-primary">
                Years of Experience <span className="text-error">*</span>
              </Label>
              <Input
                id="experience"
                type="number"
                required
                min="0"
                value={formData.experience_years || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    experience_years: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="5"
                className="border-sage-200 focus:border-sage-600 focus:ring-sage-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_letter" className="font-display text-body-sm text-text-primary">
                Cover Letter <span className="text-error">*</span>
              </Label>
              <Textarea
                id="cover_letter"
                required
                rows={6}
                placeholder="Tell us why you'd like to join Life Psychology Australia..."
                value={formData.cover_letter}
                onChange={(e) =>
                  setFormData({ ...formData, cover_letter: e.target.value })
                }
                className="resize-none border-sage-200 focus:border-sage-600 focus:ring-sage-600 font-body leading-loose"
              />
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cv" className="font-display text-body-sm text-text-primary">
                CV/Resume <span className="text-error">*</span>
              </Label>
              <Input
                id="cv"
                type="file"
                required
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange("cv")}
                className="border-sage-200 focus:border-sage-600"
              />
              <p className="font-body text-body-xs text-text-tertiary">
                Accepted formats: PDF, DOC, DOCX
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificate" className="font-display text-body-sm text-text-primary">
                AHPRA Certificate <span className="text-error">*</span>
              </Label>
              <Input
                id="certificate"
                type="file"
                required
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange("certificate")}
                className="border-sage-200 focus:border-sage-600"
              />
              <p className="font-body text-body-xs text-text-tertiary">
                Accepted formats: PDF, JPG, PNG
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo" className="font-display text-body-sm text-text-primary">
                Professional Photo (Optional)
              </Label>
              <Input
                id="photo"
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange("photo")}
                className="border-sage-200 focus:border-sage-600"
              />
              <p className="font-body text-body-xs text-text-tertiary">
                Accepted formats: JPG, PNG
              </p>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={uploading} 
            className="w-full bg-sage-600 hover:bg-sage-700 text-white font-display text-body font-semibold py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-normal"
          >
            {uploading ? "Submitting..." : "Submit Application"}
          </Button>
        </CardContent>
      </Card>
    </form>
      </div>
    </div>
  );
}