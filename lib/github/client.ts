import { Octokit } from 'octokit'
import { decrypt } from '@/lib/utils/encryption'

export function createOctokit(encryptedToken: string): Octokit {
  const token = decrypt(encryptedToken)
  return new Octokit({ auth: token })
}

export function createServerOctokit(): Octokit {
  return new Octokit({ auth: process.env.GITHUB_TOKEN })
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  language: string | null
  private: boolean
  html_url: string
  updated_at: string | null
  stargazers_count: number
}

export async function listUserRepos(octokit: Octokit): Promise<GitHubRepo[]> {
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100,
    type: 'public',
  })
  return data as GitHubRepo[]
}
