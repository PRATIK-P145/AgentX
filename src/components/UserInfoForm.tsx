import { useState } from "react";
import { UserInfo } from "@/hooks/useAssessment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Sparkles } from "lucide-react";

const CLASS_OPTIONS = [
  "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th",
  "College 1st Year", "College 2nd Year", "College 3rd Year", "College 4th Year",
];

const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"];

interface Props {
  onSubmit: (info: UserInfo) => void;
  loading: boolean;
}

export default function UserInfoForm({ onSubmit, loading }: Props) {
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [age, setAge] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!className) errs.className = "Class is required";
    if (!age || isNaN(Number(age)) || Number(age) < 5 || Number(age) > 100) errs.age = "Valid age required (5-100)";
    if (!topic.trim()) errs.topic = "Topic is required";
    if (!difficulty) errs.difficulty = "Difficulty is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ name: name.trim(), className, age: Number(age), topic: topic.trim(), difficulty });
  };

  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Adaptive Learning</h1>
          <p className="text-muted-foreground mt-2">AI-powered personalized assessment platform</p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Sparkles className="w-5 h-5 text-primary" />
              Start Your Assessment
            </CardTitle>
            <CardDescription>Fill in your details and we'll create a personalized quiz</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" className="mt-1.5" />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Class</Label>
                  <Select value={className} onValueChange={setClassName}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.className && <p className="text-sm text-destructive mt-1">{errors.className}</p>}
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Age" className="mt-1.5" min={5} max={100} />
                  {errors.age && <p className="text-sm text-destructive mt-1">{errors.age}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Photosynthesis, Linear Algebra" className="mt-1.5" />
                {errors.topic && <p className="text-sm text-destructive mt-1">{errors.topic}</p>}
              </div>

              <div>
                <Label>Difficulty Level</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_OPTIONS.map(d => (
                      <SelectItem key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.difficulty && <p className="text-sm text-destructive mt-1">{errors.difficulty}</p>}
              </div>

              <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold h-12 text-base" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Generating Questions...
                  </span>
                ) : (
                  "Generate Assessment"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
