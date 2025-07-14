import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Template Components
function LandingTemplate({ title, description, baseUrl }: { title: string; description: string; baseUrl?: string }) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {baseUrl ? (
            <img
              src={`${baseUrl}/web-app-manifest-512x512.png`}
              alt="Curia Logo"
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
              }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
              }}
            >
              ⚡
            </div>
          )}
          Curia
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 24,
            lineHeight: 1.1,
            maxWidth: 800,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 24,
            color: 'rgba(255, 255, 255, 0.9)',
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}

function GetStartedTemplate({ title, description }: { title: string; description: string }) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        background: 'linear-gradient(to right, #0F172A, #1E293B)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 24,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 22,
            color: '#94A3B8',
            lineHeight: 1.5,
            marginBottom: 32,
          }}
        >
          {description}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 18,
            color: '#3B82F6',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: '#3B82F6',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            →
          </div>
          Start Building
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        <div
          style={{
            width: 320,
            height: 200,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            padding: 24,
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: 'white',
              marginBottom: 16,
              fontWeight: '600',
            }}
          >
            Configure Your Embed
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ padding: 8, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 6, fontSize: 14, color: '#94A3B8' }}>
              Theme: Auto
            </div>
            <div style={{ padding: 8, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 6, fontSize: 14, color: '#94A3B8' }}>
              Size: 100%
            </div>
            <div style={{ padding: 8, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 6, fontSize: 14, color: '#94A3B8' }}>
              Community: Select
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityTemplate({ title, description }: { title: string; description: string }) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background: 'radial-gradient(circle at 20% 80%, #3B82F6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8B5CF6 0%, transparent 50%)',
        }}
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 60,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            marginBottom: 32,
          }}
        >
          🏛️
        </div>

        <div
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 24,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 22,
            color: '#94A3B8',
            maxWidth: 600,
            lineHeight: 1.5,
            marginBottom: 32,
          }}
        >
          {description}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 18,
            color: '#10B981',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              background: '#10B981',
              borderRadius: 4,
            }}
          />
          Live Community Forum
        </div>
      </div>
    </div>
  );
}

function DemoTemplate({ title, description }: { title: string; description: string }) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        background: 'linear-gradient(to bottom right, #1E293B, #0F172A)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        <div
          style={{
            fontSize: 20,
            color: '#3B82F6',
            marginBottom: 16,
            fontWeight: '600',
          }}
        >
          LIVE DEMO
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 24,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 22,
            color: '#94A3B8',
            lineHeight: 1.5,
            marginBottom: 32,
          }}
        >
          {description}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 18,
            color: '#F59E0B',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: '#F59E0B',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            ▶
          </div>
          Try It Now
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        <div
          style={{
            width: 350,
            height: 250,
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            padding: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: '#3B82F6',
                borderRadius: 8,
              }}
            />
            <div
              style={{
                fontSize: 16,
                color: 'white',
                fontWeight: '600',
              }}
            >
              Forum Demo
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: 12, background: 'rgba(255, 255, 255, 0.02)', borderRadius: 8 }}>
            <div style={{ width: 24, height: 24, background: 'hsl(60, 70%, 60%)', borderRadius: 12 }} />
            <div style={{ fontSize: 14, color: '#94A3B8' }}>Sample post 1</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: 12, background: 'rgba(255, 255, 255, 0.02)', borderRadius: 8 }}>
            <div style={{ width: 24, height: 24, background: 'hsl(120, 70%, 60%)', borderRadius: 12 }} />
            <div style={{ fontSize: 14, color: '#94A3B8' }}>Sample post 2</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: 12, background: 'rgba(255, 255, 255, 0.02)', borderRadius: 8 }}>
            <div style={{ width: 24, height: 24, background: 'hsl(180, 70%, 60%)', borderRadius: 12 }} />
            <div style={{ fontSize: 14, color: '#94A3B8' }}>Sample post 3</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const type = searchParams.get('type') || 'default';
    const title = searchParams.get('title') || getDefaultTitle(type);
    const description = searchParams.get('description') || getDefaultDescription(type);
    
    // Get the base URL for the logo image
    const baseUrl = new URL(req.url).origin;

    let template;
    switch (type) {
      case 'landing':
        template = <LandingTemplate title={title} description={description} baseUrl={baseUrl} />;
        break;
      case 'get-started':
        template = <GetStartedTemplate title={title} description={description} />;
        break;
      case 'community':
        template = <CommunityTemplate title={title} description={description} />;
        break;
      case 'demo':
        template = <DemoTemplate title={title} description={description} />;
        break;
      default:
        template = <LandingTemplate title={title} description={description} baseUrl={baseUrl} />;
    }

    return new ImageResponse(template, {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e: any) {
    console.log(`Failed to generate the image`, e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}

function getDefaultTitle(type: string): string {
  switch (type) {
    case 'landing':
      return 'Web3 Forum Embeds';
    case 'get-started':
      return 'Get Started with Curia';
    case 'community':
      return 'Join the Community';
    case 'demo':
      return 'See Curia in Action';
    default:
      return 'Curia';
  }
}

function getDefaultDescription(type: string): string {
  switch (type) {
    case 'landing':
      return 'Embed beautiful Web3 forums with advanced gating and community features';
    case 'get-started':
      return 'Configure, customize, and deploy your Web3 forum embed in minutes';
    case 'community':
      return 'Connect with developers building the future of Web3 communities';
    case 'demo':
      return 'Interactive demo showing real forum functionality and features';
    default:
      return 'Web3 forum infrastructure for communities';
  }
} 