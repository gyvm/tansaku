import React, { useState } from 'react';
import './styles/globals.css';
import { Button } from './components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Switch } from './components/ui/switch';
import { Slider } from './components/ui/slider';
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from './components/ui/dialog';
import { Cloud, Heart, Moon, Sun, Search, Bell } from 'lucide-react';

export default function SoftGlassApp() {
  const [sliderValue, setSliderValue] = useState([50]);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`soft-glass-theme min-h-screen bg-background text-foreground transition-colors duration-500 selection:bg-primary/20 ${darkMode ? 'dark' : ''}`}>

      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-300/30 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-300/30 dark:bg-blue-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-pink-300/20 dark:bg-pink-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-12">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 py-8">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/40 dark:bg-black/20 border border-white/50 dark:border-white/10 backdrop-blur-sm shadow-sm text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              <Cloud className="w-4 h-4 text-primary" />
              <span>Soft Glass Design System</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-br from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              Frosted Clay
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg">
              A harmonic blend of Claymorphism's softness and Glassmorphism's depth.
              Designed for calm, modern interfaces.
            </p>
          </div>

          <Card className="w-full max-w-xs bg-white/30 dark:bg-white/5">
            <CardContent className="pt-6 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="p-3 rounded-full bg-white/50 dark:bg-white/10 shadow-inner">
                   {darkMode ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-amber-500" />}
                 </div>
                 <div className="space-y-0.5">
                   <Label>Theme Mode</Label>
                   <p className="text-xs text-muted-foreground">{darkMode ? 'Dark' : 'Light'}</p>
                 </div>
               </div>
               <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </CardContent>
          </Card>
        </header>

        {/* Buttons Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
             <h2 className="text-2xl font-semibold opacity-80">Buttons</h2>
             <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Primary</h3>
                <Button>Primary Action</Button>
                <Button className="w-full">Full Width</Button>
             </div>
             <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Secondary</h3>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="secondary" className="w-full">Cancel</Button>
             </div>
             <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Destructive</h3>
                <Button variant="destructive">Delete Account</Button>
             </div>
             <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Icon & Ghost</h3>
                <div className="flex gap-4">
                   <Button size="icon" variant="secondary"><Heart className="w-5 h-5 text-pink-500 fill-pink-500/20" /></Button>
                   <Button size="icon"><Bell className="w-5 h-5" /></Button>
                   <Button variant="ghost">Ghost Button</Button>
                </div>
             </div>
          </div>
        </section>

        {/* Inputs & Forms Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
             <h2 className="text-2xl font-semibold opacity-80">Forms & Inputs</h2>
             <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
             <Card>
                <CardHeader>
                   <CardTitle>Account Details</CardTitle>
                   <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="Alice Wonderland" />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <Input id="email" className="pl-10" placeholder="alice@example.com" />
                      </div>
                   </div>
                   <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                         <Label>Notifications</Label>
                         <Switch defaultChecked />
                      </div>
                      <div className="space-y-3">
                         <div className="flex justify-between">
                            <Label>Volume Level</Label>
                            <span className="text-sm text-slate-500 dark:text-slate-400">{sliderValue}%</span>
                         </div>
                         <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
                      </div>
                   </div>
                </CardContent>
                <CardFooter>
                   <Button className="w-full">Save Changes</Button>
                </CardFooter>
             </Card>

             <div className="space-y-6">
                 {/* Dialog Demo */}
                 <Card className="bg-primary/5 border-primary/10">
                    <CardHeader>
                       <CardTitle className="text-primary">Interactive Dialog</CardTitle>
                       <CardDescription>A modal dialog with glass backdrop blur.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                          Click the button below to see the overlay effect and animation.
                       </p>
                       <Dialog>
                          <DialogTrigger asChild>
                             <Button variant="default">Open Dialog</Button>
                          </DialogTrigger>
                          <DialogContent>
                             <DialogHeader>
                                <DialogTitle>Edit Profile</DialogTitle>
                                <DialogDescription>
                                   Make changes to your profile here. Click save when you're done.
                                </DialogDescription>
                             </DialogHeader>
                             <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                   <Label htmlFor="username" className="text-right">Username</Label>
                                   <Input id="username" defaultValue="@peduarte" className="col-span-3" />
                                </div>
                             </div>
                             <DialogFooter>
                                <DialogClose asChild>
                                   <Button variant="secondary">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Save changes</Button>
                             </DialogFooter>
                          </DialogContent>
                       </Dialog>
                    </CardContent>
                 </Card>

                 {/* Just some glass cards */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="glass-panel p-4 flex flex-col items-center justify-center text-center space-y-2 aspect-square group cursor-pointer hover:bg-white/70 transition-colors">
                       <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-300 shadow-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                          <Cloud className="w-6 h-6" />
                       </div>
                       <span className="font-medium text-sm">Weather</span>
                    </div>
                    <div className="glass-panel p-4 flex flex-col items-center justify-center text-center space-y-2 aspect-square group cursor-pointer hover:bg-white/70 transition-colors">
                       <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 shadow-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                          <Heart className="w-6 h-6" />
                       </div>
                       <span className="font-medium text-sm">Health</span>
                    </div>
                 </div>
             </div>
          </div>
        </section>

      </div>
    </div>
  );
}
