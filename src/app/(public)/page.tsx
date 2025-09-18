'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  Award,
  CheckCircle,
  Clock,
  CreditCard,
  Globe,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';

export default function HomePage() {
  const categories = [
    {
      icon: Home,
      title: 'Housing',
      description: 'Find or offer apartments, rooms, and housing solutions across Italy',
      color: 'from-blue-500/10 to-blue-600/5',
      badge: 'Popular',
    },
    {
      icon: Truck,
      title: 'Transportation',
      description: 'Send and receive packages between Iran and Italy with trusted travelers',
      color: 'from-green-500/10 to-green-600/5',
      badge: 'Trusted',
    },
    {
      icon: CreditCard,
      title: 'Currency Exchange',
      description: 'Exchange EUR-IRR with verified community members at fair rates',
      color: 'from-yellow-500/10 to-yellow-600/5',
      badge: 'Secure',
    },
    {
      icon: ShoppingBag,
      title: 'Marketplace',
      description: 'Buy and sell second-hand items within the Iranian community',
      color: 'from-purple-500/10 to-purple-600/5',
      badge: 'Active',
    },
    {
      icon: Settings,
      title: 'Services',
      description: 'Offer or find personal services like tutoring, translation, and more',
      color: 'from-orange-500/10 to-orange-600/5',
      badge: 'Growing',
    },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Trust & Verification',
      description: 'Verified profiles and city confirmation for safer transactions',
      stats: '95% Trust Rate',
    },
    {
      icon: MapPin,
      title: 'City-Based',
      description: 'Find relevant listings in your specific Italian city',
      stats: '20+ Cities',
    },
    {
      icon: Users,
      title: 'Community Focused',
      description: 'Built specifically for the Iranian community in Italy',
      stats: '1000+ Members',
    },
  ];

  const stats = [
    { icon: Users, label: 'Active Members', value: '1,200+', trend: '+15%' },
    { icon: CheckCircle, label: 'Successful Connections', value: '3,500+', trend: '+25%' },
    { icon: Globe, label: 'Italian Cities', value: '25+', trend: '+8%' },
    { icon: Star, label: 'Average Rating', value: '4.8/5', trend: '+0.2' },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Enhanced Gradient Background with Multiple Patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/20 via-muted/30 to-pink-100/20 rounded-2xl">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="30" cy="30" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-primary/5 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-l from-secondary/5 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-accent/5 to-transparent rounded-full blur-3xl animate-pulse delay-2000" />
        </div>
      </div>

      <div className="relative space-y-8 p-2">
        {/* Hero Section Card */}
        <section className="container mx-auto ">
          <Card className="border-0 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-sm shadow-2xl">
            <CardContent className="py-20 text-center">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-center mb-6">
                  <Badge variant="secondary" className="px-6 py-2 text-sm animate-bounce">
                    <Heart className="w-4 h-4 mr-2 text-red-500" />
                    For the Iranian Community in Italy
                    <Sparkles className="w-4 h-4 ml-2 text-yellow-500" />
                  </Badge>
                </div>

                <h1 className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent animate-in slide-in-from-bottom duration-1000">
                  Welcome to ItaliHub
                </h1>

                <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto animate-in slide-in-from-bottom duration-1000 delay-200">
                  Your central hub connecting Iranians across Italy. Find housing, exchange
                  currency, send packages, buy & sell goods, and discover trusted services in your
                  community.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center animate-in slide-in-from-bottom duration-1000 delay-400">
                  <Button size="lg" className="group px-8 py-6 text-lg">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Explore Categories
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                    <Users className="w-5 h-5 mr-2" />
                    Join Community
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Stats Section Card */}
        <section className="container mx-auto">
          <Card className="border-0 bg-gradient-to-r from-card/90 to-card/70 backdrop-blur-sm">
            <CardContent className="py-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="text-center group">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-2xl font-bold mb-1">{stat.value}</div>
                      <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
                      <div className="text-xs text-green-600 flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {stat.trend}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Categories Section Card */}
        <section className="container mx-auto">
          <Card className="border-0 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm">
            <CardHeader className="text-center py-12">
              <div className="flex justify-center mb-4">
                <Badge variant="outline" className="px-4 py-2">
                  <Globe className="w-4 h-4 mr-2" />
                  Five Essential Categories
                </Badge>
              </div>
              <CardTitle className="text-4xl font-bold mb-4">Everything You Need</CardTitle>
              <CardDescription className="text-lg max-w-2xl mx-auto">
                Everything you need as an Iranian living in Italy, organized and easily searchable
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {categories.map((category, index) => {
                  const Icon = category.icon;
                  return (
                    <Card
                      key={index}
                      className="group hover:shadow-xl transition-all duration-500 border-0 bg-gradient-to-br from-card to-muted/20 hover:scale-105 relative overflow-hidden"
                    >
                      {/* Floating Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <Badge variant="secondary" className="text-xs px-2 py-1">
                          {category.badge}
                        </Badge>
                      </div>

                      <CardHeader className="text-center relative">
                        <div
                          className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r ${category.color} flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg`}
                        >
                          <Icon className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {category.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-center text-base leading-relaxed">
                          {category.description}
                        </CardDescription>
                      </CardContent>

                      {/* Hover Effect Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Features Section Card */}
        <section className="container mx-auto">
          <Card className="border-0 bg-gradient-to-bl from-card/95 to-card/80 backdrop-blur-sm">
            <CardHeader className="text-center py-12">
              <div className="flex justify-center mb-4">
                <Badge variant="outline" className="px-4 py-2">
                  <Award className="w-4 h-4 mr-2" />
                  Why Choose ItaliHub
                </Badge>
              </div>
              <CardTitle className="text-4xl font-bold mb-4">Built for Trust & Community</CardTitle>
              <CardDescription className="text-lg max-w-2xl mx-auto">
                Features designed to create a safe and reliable platform for our community
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="text-center group">
                      <div className="relative mb-8">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:shadow-primary/25 transition-all duration-500">
                          <Icon className="w-10 h-10 text-primary-foreground" />
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <Badge variant="secondary" className="text-xs px-3 py-1">
                            {feature.stats}
                          </Badge>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Call to Action Section Card */}
        <section className="container mx-auto pb-8">
          <Card className="border-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 backdrop-blur-sm relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-r from-primary/20 to-transparent rounded-full blur-2xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-l from-secondary/20 to-transparent rounded-full blur-2xl animate-pulse delay-1000" />
            </div>

            <CardContent className="py-16 relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex justify-center mb-6">
                  <Badge className="px-6 py-2 text-sm bg-primary/20 text-primary border-primary/30">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Join Today
                    <Clock className="w-4 h-4 ml-2" />
                  </Badge>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Ready to Join the Community?
                </h2>

                <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                  Browse listings for free, or complete your profile to start posting and connecting
                  with fellow Iranians across Italy.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Button
                    size="lg"
                    className="group px-10 py-6 text-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-2xl hover:shadow-primary/25"
                  >
                    <Star className="w-5 h-5 mr-2" />
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-10 py-6 text-lg border-2 hover:bg-muted/20"
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    Learn More
                  </Button>
                </div>

                <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Free to Browse
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Verified Profiles
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    24/7 Support
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
