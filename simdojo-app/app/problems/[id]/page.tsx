import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getProblem } from "@/lib/api"
import { ProblemPageClient } from "./page-client"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id } = await props.params
  try {
    const problem = await getProblem(id)
    return {
      title: problem.title,
      description: `Solve "${problem.title}" — an AVX2 SIMD challenge on simdojo`,
      openGraph: {
        title: problem.title,
        description: `Solve "${problem.title}" — an AVX2 SIMD challenge on simdojo`,
      },
    }
  } catch {
    return { title: "Challenge" }
  }
}

export default async function ProblemPage(props: Props) {
  const { id } = await props.params

  let problem
  try {
    problem = await getProblem(id)
  } catch {
    notFound()
  }

  return <ProblemPageClient problem={problem} />
}
