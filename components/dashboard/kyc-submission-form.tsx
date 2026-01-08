"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, FileText } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";

interface KYCSubmissionFormProps {
  onClose: () => void;
  onSubmit: () => void;
}

export function KYCSubmissionForm({ onClose, onSubmit }: KYCSubmissionFormProps) {
  const { account } = useWallet();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    documentType: "passport",
    documentNumber: "",
    dateOfBirth: "",
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setSubmitting(true);

    try {
      // In production, you would:
      // 1. Upload document to IPFS or secure storage
      // 2. Send KYC data to backend for verification
      // 3. Store document hash on XRPL DID

      // For demo, we'll simulate with localStorage
      const documentHash = documentFile
        ? `hash_${Math.random().toString(36).substring(7)}`
        : undefined;

      const kycSubmission = {
        address: account.address,
        status: "pending",
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        dateOfBirth: formData.dateOfBirth,
        documentHash,
        submittedAt: new Date().toISOString(),
      };

      // Get existing KYC submissions
      const storedKYC = localStorage.getItem('kyc_submissions') || '[]';
      const allKYC = JSON.parse(storedKYC);

      // Update or add new submission
      const existingIndex = allKYC.findIndex((k: any) => k.address === account.address);
      if (existingIndex >= 0) {
        allKYC[existingIndex] = { ...allKYC[existingIndex], ...kycSubmission };
      } else {
        allKYC.push(kycSubmission);
      }

      localStorage.setItem('kyc_submissions', JSON.stringify(allKYC));

      alert('KYC submitted successfully! Please wait for admin approval.');
      onSubmit();
      onClose();
    } catch (err) {
      console.error('KYC submission error:', err);
      alert('Failed to submit KYC. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>KYC Verification</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>

              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  className="border-yellow-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="border-yellow-300"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                    className="border-yellow-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="United States"
                    className="border-yellow-300"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="border-yellow-300"
                  />
                </div>
              </div>
            </div>

            {/* Document Verification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Document Verification</h3>

              <div>
                <Label htmlFor="documentType">Document Type *</Label>
                <select
                  id="documentType"
                  required
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="national_id">National ID</option>
                </select>
              </div>

              <div>
                <Label htmlFor="documentNumber">Document Number *</Label>
                <Input
                  id="documentNumber"
                  required
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  placeholder="ABC123456"
                  className="border-yellow-300"
                />
              </div>

              <div>
                <Label htmlFor="documentFile">Upload Document (Optional)</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Input
                    id="documentFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="border-yellow-300"
                  />
                  {documentFile && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <FileText className="h-4 w-4" />
                      {documentFile.name}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPG, PNG, PDF (max 5MB)
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-semibold mb-2">Privacy & Security</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>Your data is encrypted and stored securely</li>
                <li>Document hash will be stored on XRPL DID</li>
                <li>Only authorized admins can review your submission</li>
                <li>You can delete your data at any time</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                {submitting ? 'Submitting...' : 'Submit KYC'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
