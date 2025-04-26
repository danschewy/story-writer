"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users } from "lucide-react"
import Link from "next/link"
import { getUserSessions } from "@/lib/actions"
import type { Session } from "@/lib/types"

export function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSessions() {
      try {
        const userSessions = await getUserSessions()
        setSessions(userSessions)
      } catch (error) {
        console.error("Failed to fetch sessions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSessions()
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-24 bg-muted" />
            <CardContent className="h-20 mt-4 space-y-2">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No story sessions yet</h2>
        <p className="text-muted-foreground mb-4">Create your first story session to get started</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardHeader>
            <CardTitle className="line-clamp-1">{session.title}</CardTitle>
            <CardDescription>Created {new Date(session.createdAt).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="mr-1 h-4 w-4" />
              {session.participantCount} participants
            </div>
            <p className="mt-2 line-clamp-2 text-sm">{session.lastUpdate}</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/session/${session.id}`}>Continue Story</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
