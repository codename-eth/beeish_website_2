import { NextResponse } from "next/server"

// This is the API route for revealing NFTs
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()
    const { tokenId } = body

    // Validate the token ID
    if (!tokenId) {
      return NextResponse.json({ success: false, message: "Token ID is required" }, { status: 400 })
    }

    // Get the passcode from environment variables
    const REVEAL_PASSCODE = process.env.REVEAL_PASSCODE

    // Validate the passcode is configured
    if (!REVEAL_PASSCODE) {
      console.error("REVEAL_PASSCODE environment variable is not set")
      return NextResponse.json({ success: false, message: "Server configuration error" }, { status: 500 })
    }

    // In a real application, you would call your backend service or blockchain to reveal the NFT
    // For this example, we'll simulate a successful reveal

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Call the external API with the correct passcode
    try {
      const apiResponse = await fetch(
        `https://secure-metadata-api-beeish.vercel.app/api/reveal-token/${tokenId}?passcode=${REVEAL_PASSCODE}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}))
        return NextResponse.json(
          {
            success: false,
            message: errorData.message || `API error: ${apiResponse.statusText}`,
          },
          { status: apiResponse.status },
        )
      }

      // Get the response data
      const apiData = await apiResponse.json()

      // Return the API response
      return NextResponse.json(apiData)
    } catch (error: any) {
      console.error("Error calling reveal API:", error)
      return NextResponse.json(
        { success: false, message: error.message || "Failed to call reveal API" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in reveal API route:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
