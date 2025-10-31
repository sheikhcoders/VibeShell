import Head from 'next/head'
import TerminalView from '../components/TerminalView'

export default function Home() {
  return (
    <div>
      <Head>
        <title>VibeShell</title>
        <meta name="description" content="Web Cloud Shell" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <TerminalView />
      </main>
    </div>
  )
}
