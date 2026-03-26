import { notFound } from "next/navigation"
import { getProblem } from "@/lib/api"
import { ProblemPageClient } from "./page-client"

interface Props {
  params: Promise<{ id: string }>
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
