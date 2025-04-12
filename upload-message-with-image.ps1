# Set variables
$imageFilePath = "./images-to-upload/jethro.jpg" # Update this path to your actual image
$message = "Jethro says a heartfelt hello and would like to quote this to you: ""Jabberwocky!"""
$apiUrl = "http://localhost:3000/api/upload-image"

# Check if the image file exists
if (-not (Test-Path $imageFilePath)) {
    Write-Error "Image file not found at path: $imageFilePath"
    exit 1
}

Write-Host "Uploading image with message..." -ForegroundColor Green

# Create a form with the image and message
$form = @{
    file = Get-Item $imageFilePath
    message = $message
}

# Upload the image and create the message
try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Form $form
    
    # Display response
    Write-Host "Upload successful!" -ForegroundColor Green
    Write-Host "Message ID: $($response.data.messageId)" -ForegroundColor Cyan
    Write-Host "Image URL: $($response.data.url)" -ForegroundColor Cyan
    
    # Now send the message
    $messageId = $response.data.messageId
    $sendUrl = "http://localhost:3000/api/send-supabase-message?messageId=$messageId"
    
    Write-Host "Sending message with image..." -ForegroundColor Green
    $sendResponse = Invoke-RestMethod -Uri $sendUrl -Method Get
    
    # Display send response
    Write-Host "Message sent successfully!" -ForegroundColor Green
    Write-Host "Twilio SID: $($sendResponse.details.twilioResponse.sid)" -ForegroundColor Cyan
    Write-Host "Status: $($sendResponse.details.twilioResponse.status)" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error occurred: $_" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    try {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Error details: $($errorDetails.error)" -ForegroundColor Red
    } catch {
        Write-Host "Full error: $_" -ForegroundColor Red
    }
} 