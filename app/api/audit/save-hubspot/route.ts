import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { createOrUpdateHubSpotContact, createHubSpotDeal } from "@/lib/integrations/hubspot";

interface SaveHubSpotRequest {
  sessionId: string;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = (await req.json()) as SaveHubSpotRequest;
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Load session data from Redis
    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    const session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    const info = session.extracted_info;
    
    // Only proceed if we have contact information
    const contactInfo = info?.contact_info;
    const discoveryInfo = info?.discovery;
    
    if (!session.email && !contactInfo?.email) {
      return NextResponse.json({
        success: false,
        error: "Email not available"
      }, { status: 400 });
    }

    // Extract contact details
    const email = contactInfo?.email || session.email;
    const name = contactInfo?.name || "Lead";
    const company = contactInfo?.company || discoveryInfo?.industry || "Unknown Company";

    // Create or update contact in HubSpot with proper data
    const contactResult = await createOrUpdateHubSpotContact({
      email,
      firstname: contactInfo.name ? contactInfo.name.split(' ')[0] : 'Lead',
      lastname: contactInfo.name ? contactInfo.name.split(' ').slice(1).join(' ') || 'Contact' : 'Contact',
      company: contactInfo.company || `${discoveryInfo.industry} Company` || 'Tech Company',
      phone: null,
    });

    if (!contactResult.success) {
      return NextResponse.json({
        success: false,
        error: contactResult.error
      }, { status: 500 });
    }

    // Create deal if we have opportunities
    let dealResult = { success: true, dealUrl: null };
    
    if (session.opportunities && session.opportunities.length > 0) {
      const totalValue = session.opportunities.reduce((sum: number, opp: any) => sum + (opp.monthly_savings * 12), 0);
      
      dealResult = await createHubSpotDeal({
        email: contactInfo.email || session.email,
        name: contactInfo.name || 'Lead Contact',
        company: contactInfo.company || `${discoveryInfo.industry} Company` || 'Tech Company',
        dealValue: totalValue,
        painScore: 85,
        auditUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/audit/report/${sessionId}`,
        timeline: painPoints.timeline || "2-3 months",
        budgetRange: painPoints.budget || "$10k-$25k",
      });

      if (!dealResult.success) {
        console.warn("[HubSpot] Failed to create deal:", dealResult.error);
      }
    }

    // Update session to mark HubSpot integration
    try {
      await db.auditSession.update({
        where: { sessionId },
        data: {
          hubspotContactId: contactResult.contactId,
          hubspotDealId: dealResult.dealId,
          updatedAt: new Date(),
        }
      });
    } catch (dbError) {
      console.warn("[HubSpot] Database update failed:", dbError);
      // Continue even if DB update fails
    }

    return NextResponse.json({
      success: true,
      message: "Client information saved to HubSpot successfully",
      contactId: contactResult.contactId,
      dealId: dealResult.dealId,
      dealUrl: dealResult.dealUrl,
    });

  } catch (error) {
    console.error("[API] HubSpot integration error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
