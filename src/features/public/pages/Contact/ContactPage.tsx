import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { publicService } from "../../services/publicService";
import { Mail, Phone, MapPin, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface CountryCodeOption {
  code: string;
  name: string;
  flag: string;
  digitsMin: number;
  digitsMax: number;
  placeholder: string;
}

const COUNTRY_CODES: CountryCodeOption[] = [
  { code: "+1", name: "United States / Canada", flag: "🇺🇸", digitsMin: 10, digitsMax: 10, placeholder: "555 123 4567" },
  { code: "+91", name: "India", flag: "🇮🇳", digitsMin: 10, digitsMax: 10, placeholder: "98765 43210" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧", digitsMin: 10, digitsMax: 11, placeholder: "7911 123456" },
  { code: "+61", name: "Australia", flag: "🇦🇺", digitsMin: 9, digitsMax: 9, placeholder: "412 345 678" },
  { code: "+971", name: "UAE", flag: "🇦🇪", digitsMin: 9, digitsMax: 9, placeholder: "50 123 4567" },
  { code: "+65", name: "Singapore", flag: "🇸🇬", digitsMin: 8, digitsMax: 8, placeholder: "8123 4567" },
  { code: "+49", name: "Germany", flag: "🇩🇪", digitsMin: 10, digitsMax: 11, placeholder: "151 12345678" },
  { code: "+33", name: "France", flag: "🇫🇷", digitsMin: 9, digitsMax: 9, placeholder: "6 12 34 56 78" },
  { code: "+81", name: "Japan", flag: "🇯🇵", digitsMin: 10, digitsMax: 10, placeholder: "90 1234 5678" },
  { code: "+41", name: "Switzerland", flag: "🇨🇭", digitsMin: 9, digitsMax: 9, placeholder: "78 123 45 67" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦", digitsMin: 9, digitsMax: 9, placeholder: "50 123 4567" },
  { code: "+86", name: "China", flag: "🇨🇳", digitsMin: 11, digitsMax: 11, placeholder: "138 1234 5678" },
  { code: "+353", name: "Ireland", flag: "🇮🇪", digitsMin: 9, digitsMax: 9, placeholder: "87 123 4567" },
  { code: "+31", name: "Netherlands", flag: "🇳🇱", digitsMin: 9, digitsMax: 9, placeholder: "6 12345678" },
  { code: "+other", name: "Other (International)", flag: "🌐", digitsMin: 7, digitsMax: 15, placeholder: "Enter complete phone number" },
];

const contactSchema = z.object({
  name: z.string().min(2, "Full name is required (at least 2 characters)"),
  email: z.string().email("Valid work email address is required"),
  subject: z.string().min(3, "Subject is required (at least 3 characters)"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export const ContactPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Country code & Phone Number State
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("+91");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");

  const currentCountry = COUNTRY_CODES.find((c) => c.code === selectedCountryCode) || COUNTRY_CODES[0];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema)
  });

  const validatePhoneNumber = (phone: string, countryCode: string): string => {
    const rawDigits = phone.replace(/\D/g, "");
    const country = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

    if (!rawDigits) {
      return "Phone number is required";
    }

    if (country.code === "+other") {
      if (rawDigits.length < 7 || rawDigits.length > 15) {
        return "Please enter a valid international phone number (7 to 15 digits)";
      }
      return "";
    }

    if (country.digitsMin === country.digitsMax) {
      if (rawDigits.length !== country.digitsMin) {
        return `${country.name} phone number must be exactly ${country.digitsMin} digits (${rawDigits.length}/${country.digitsMin})`;
      }
    } else {
      if (rawDigits.length < country.digitsMin || rawDigits.length > country.digitsMax) {
        return `${country.name} phone number must be between ${country.digitsMin} and ${country.digitsMax} digits (${rawDigits.length} entered)`;
      }
    }

    return "";
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const country = COUNTRY_CODES.find((c) => c.code === selectedCountryCode) || COUNTRY_CODES[0];
    
    // Hard restrict: User cannot enter more digits than the allowed country maximum
    const clampedDigits = raw.slice(0, country.digitsMax);
    setPhoneNumber(clampedDigits);

    if (clampedDigits.length > 0) {
      setPhoneError(validatePhoneNumber(clampedDigits, selectedCountryCode));
    } else {
      setPhoneError("");
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setSelectedCountryCode(newCode);
    const country = COUNTRY_CODES.find((c) => c.code === newCode) || COUNTRY_CODES[0];

    // Re-clamp existing digits to the new country limit
    const raw = phoneNumber.replace(/\D/g, "");
    const clampedDigits = raw.slice(0, country.digitsMax);
    setPhoneNumber(clampedDigits);

    if (clampedDigits.length > 0) {
      setPhoneError(validatePhoneNumber(clampedDigits, newCode));
    } else {
      setPhoneError("");
    }
  };

  const onSubmit = async (data: ContactFormValues) => {
    const pError = validatePhoneNumber(phoneNumber, selectedCountryCode);
    if (pError) {
      setPhoneError(pError);
      return;
    }

    setPhoneError("");
    setIsSubmitting(true);
    setSubmitError(null);

    const rawDigits = phoneNumber.replace(/\D/g, "");
    const formattedPhone = selectedCountryCode === "+other"
      ? phoneNumber.trim()
      : `${selectedCountryCode} ${rawDigits}`;

    try {
      await publicService.submitContactForm({
        ...data,
        phone: formattedPhone,
      });
      setSuccess(true);
      reset();
      setPhoneNumber("");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background pt-32 sm:pt-36 pb-24 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column - Info */}
          <div className="lg:col-span-5">
            <p className="text-primary font-mono text-xs tracking-widest uppercase mb-3">CONTACT US</p>
            <h1 
              style={{ 
                fontSize: "clamp(2.2rem, 3.8vw, 3.25rem)", 
                lineHeight: "1.15", 
                fontWeight: 700, 
                letterSpacing: "-0.02em", 
                margin: "0.25rem 0 1.25rem",
                color: "#f8fafc",
                maxWidth: "100%",
                wordBreak: "break-word"
              }}
            >
              Start the <span style={{ color: "#94a3b8" }}>conversation.</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-10 text-sm sm:text-base">
              Whether you're looking to transform your enterprise or explore our capabilities, our team is ready to help.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="p-2.5 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">Global Headquarters</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    100 Innovation Way<br />
                    Suite 400<br />
                    San Francisco, CA 94105
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-2.5 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">Email</h3>
                  <p className="text-muted-foreground text-xs">hello@aurexion.io</p>
                  <p className="text-muted-foreground text-xs">support@aurexion.io</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-2.5 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">Phone</h3>
                  <p className="text-muted-foreground text-xs">+1 (555) 123-4567</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-7">
            <div className="bg-card border border-border/40 rounded-lg p-6 sm:p-8 md:p-10 shadow-lg">
              {success ? (
                <div className="py-12 flex flex-col items-center text-center">
                  <CheckCircle2 className="h-16 w-16 text-primary mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Message Sent</h3>
                  <p className="text-muted-foreground max-w-md mb-8 text-sm">
                    Thank you for reaching out. A member of our team will review your inquiry and get back to you shortly.
                  </p>
                  <button 
                    onClick={() => setSuccess(false)} 
                    className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-6 text-foreground">Send a Message</h2>
                  
                  {submitError && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                      <p className="text-sm">{submitError}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-foreground">
                          Full Name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input 
                          id="name" 
                          {...register("name")} 
                          className="w-full p-3 rounded-md bg-background focus:outline-none transition-colors text-sm"
                          style={{
                            border: errors.name ? "1px solid #ef4444" : "1px solid #1e293b",
                            boxShadow: errors.name ? "0 0 0 1px rgba(239, 68, 68, 0.25)" : undefined,
                          }}
                          placeholder="e.g. Alex Morgan"
                        />
                        {errors.name && (
                          <p style={{ color: "#ef4444", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.35rem", fontFamily: "IBM Plex Mono, monospace" }}>
                            <AlertCircle size={14} style={{ flexShrink: 0 }} />
                            <span>{errors.name.message}</span>
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-foreground">
                          Work Email <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input 
                          id="email" 
                          type="email"
                          {...register("email")} 
                          className="w-full p-3 rounded-md bg-background focus:outline-none transition-colors text-sm"
                          style={{
                            border: errors.email ? "1px solid #ef4444" : "1px solid #1e293b",
                            boxShadow: errors.email ? "0 0 0 1px rgba(239, 68, 68, 0.25)" : undefined,
                          }}
                          placeholder="e.g. alex@company.com"
                        />
                        {errors.email && (
                          <p style={{ color: "#ef4444", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.35rem", fontFamily: "IBM Plex Mono, monospace" }}>
                            <AlertCircle size={14} style={{ flexShrink: 0 }} />
                            <span>{errors.email.message}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Phone Number Field with Country Code */}
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium text-foreground">
                        Phone Number <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={selectedCountryCode}
                          onChange={handleCountryChange}
                          className="p-3 rounded-md bg-background focus:outline-none transition-colors cursor-pointer text-sm font-medium"
                          style={{
                            border: "1px solid #1e293b",
                            minWidth: "160px",
                            color: "#f8fafc",
                            backgroundColor: "#050811",
                          }}
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code} style={{ backgroundColor: "#050811", color: "#f8fafc" }}>
                              {c.flag} {c.code} ({c.name.split(" / ")[0].split(" ")[0]})
                            </option>
                          ))}
                        </select>

                        <input 
                          id="phone" 
                          type="tel"
                          value={phoneNumber}
                          maxLength={currentCountry.digitsMax}
                          onChange={handlePhoneChange}
                          className="w-full p-3 rounded-md bg-background focus:outline-none transition-colors font-mono text-sm"
                          style={{
                            border: phoneError ? "1px solid #ef4444" : "1px solid #1e293b",
                            boxShadow: phoneError ? "0 0 0 1px rgba(239, 68, 68, 0.25)" : undefined,
                          }}
                          placeholder={currentCountry.placeholder}
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.35rem" }}>
                        {phoneError ? (
                          <p style={{ color: "#ef4444", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem", margin: 0, fontFamily: "IBM Plex Mono, monospace" }}>
                            <AlertCircle size={14} style={{ flexShrink: 0 }} />
                            <span>{phoneError}</span>
                          </p>
                        ) : (
                          <span />
                        )}
                        {phoneNumber.length > 0 && (
                          <span style={{ fontSize: "0.75rem", color: phoneError ? "#ef4444" : "#64748b", fontFamily: "IBM Plex Mono, monospace", marginLeft: "auto" }}>
                            {phoneNumber.length} / {currentCountry.digitsMax} digits
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-sm font-medium text-foreground">
                        Subject <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input 
                        id="subject" 
                        {...register("subject")} 
                        className="w-full p-3 rounded-md bg-background focus:outline-none transition-colors text-sm"
                        style={{
                          border: errors.subject ? "1px solid #ef4444" : "1px solid #1e293b",
                          boxShadow: errors.subject ? "0 0 0 1px rgba(239, 68, 68, 0.25)" : undefined,
                        }}
                        placeholder="e.g. Enterprise Cloud Architecture Consultation"
                      />
                      {errors.subject && (
                        <p style={{ color: "#ef4444", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.35rem", fontFamily: "IBM Plex Mono, monospace" }}>
                          <AlertCircle size={14} style={{ flexShrink: 0 }} />
                          <span>{errors.subject.message}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium text-foreground">
                        How can we help? <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <textarea 
                        id="message" 
                        rows={5}
                        {...register("message")} 
                        className="w-full p-3 rounded-md bg-background focus:outline-none transition-colors text-sm resize-none"
                        style={{
                          border: errors.message ? "1px solid #ef4444" : "1px solid #1e293b",
                          boxShadow: errors.message ? "0 0 0 1px rgba(239, 68, 68, 0.25)" : undefined,
                        }}
                        placeholder="Please tell us about your project goals, timelines, or specific technical requirements..."
                      />
                      {errors.message && (
                        <p style={{ color: "#ef4444", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.35rem", fontFamily: "IBM Plex Mono, monospace" }}>
                          <AlertCircle size={14} style={{ flexShrink: 0 }} />
                          <span>{errors.message.message}</span>
                        </p>
                      )}
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</>
                      ) : (
                        "Send Message"
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;
