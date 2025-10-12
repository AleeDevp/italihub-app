'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CreditCard, Home, Info } from 'lucide-react';

export function VerificationMethodsGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Verification Methods Guide
        </CardTitle>
        <CardDescription>Learn about the different ways to verify your account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Landmark Selfie */}
          <div className="border rounded-lg p-4 text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 rounded-full bg-blue-100">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 text-sm mb-2">Landmark Selfie</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Take a selfie at a recognizable landmark in your city
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5 text-left">
                  <li>• Must clearly show your face and the landmark</li>
                  <li>• Landmark must be easily recognizable and in your registered city</li>
                  <li>• Good lighting and clear image quality required</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Identity Documents */}
          <div className="border rounded-lg p-4 text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 rounded-full bg-green-100">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-green-900 text-sm mb-2">
                  Official Identity Documents
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Government-issued ID, student card, or residence permit
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5 text-left">
                  <li>• Italian ID card (Carta d&apos;Identità)</li>
                  <li>• EU residence permit (Permesso di Soggiorno)</li>
                  <li>• Valid student ID from Italian institution</li>
                  <li>• All text must be clearly visible and readable</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Address Proof */}
          <div className="border rounded-lg p-4 text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 rounded-full bg-purple-100">
                <Home className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-purple-900 text-sm mb-2">Proof of Address</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Documents showing your current address in Italy
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5 text-left">
                  <li>• Rental contract (Contratto di Locazione)</li>
                  <li>• Utility bills (electricity, gas, water)</li>
                  <li>• Bank statements with Italian address</li>
                  <li>• Document must be issued within the last 3 months</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
