# Torrent Data Structure and Time Extension API

## Torrent Object Structure

The torrent object represents a download in the system and contains the following properties:

```typescript
interface Torrent {
    // Basic Information
    id: number;                    // Unique identifier for the torrent
    title: string;                 // Title of the torrent
    name: string;                  // Name of the torrent file
    url: string;                   // URL to download the torrent file
    
    // Time Information
    addedDate: number;             // Unix timestamp when the torrent was added
    addedDateHuman: string;        // Human-readable date when the torrent was added
    msToDeletion: number;          // Milliseconds until automatic deletion
    remainingTimeToDeletion: number; // Remaining milliseconds until deletion
    
    // Progress Information
    percentDone: number;           // Download progress (0.0 to 1.0)
    downloadedEver: number;        // Total bytes downloaded
    uploadedEver: number;          // Total bytes uploaded
    totalSize: number;             // Total size of the torrent in bytes
    
    // Network Information
    peersSendingToUs: number;      // Number of peers we're downloading from
    peersGettingFromUs: number;    // Number of peers downloading from us
    rateDownload: number;          // Current download rate in bytes/second
    eta: number;                   // Estimated time until completion in milliseconds
    
    // Media Information
    background_image?: string;     // URL to background image
    background_image_original?: string; // URL to original background image
    small_cover_image?: string;    // URL to small cover image
    medium_cover_image?: string;   // URL to medium cover image
    large_cover_image?: string;    // URL to large cover image
}
```

## Time Extension API

### Endpoint: POST `/add_time`

Extends the deletion time of a torrent by 30 minutes.

#### Request
```json
{
    "torrent_id": number
}
```

#### Response
Success Response:
```json
{
    "status": "ok"
}
```

Error Responses:
```json
{
    "error": "torrent not found"
}
```
or
```json
{
    "error": "bad request"
}
```

#### Frontend Implementation
The frontend implements additional constraints:
- Maximum of 5 extensions per torrent
- 30-minute cooldown period between extensions
- Visual feedback through a circular progress indicator
- Automatic UI updates to reflect the new deletion time

#### Example Usage
```javascript
// Frontend implementation
const handleExtension = async () => {
    if (canExtend()) {
        try {
            const response = await add_time(torrent.id);
            if (response.status === 'ok') {
                setMsToDeletion(prev => prev + (30 * 60 * 1000));
                setExtensionCount(prev => prev + 1);
                setLastExtensionTime(Date.now());
            }
        } catch (error) {
            console.error('Error extending time:', error);
        }
    }
};
```

## Notes
- The time extension system is designed to prevent indefinite storage of torrents
- Each extension adds exactly 30 minutes to the deletion time
- The frontend enforces usage limits to prevent abuse
- The system maintains consistency between frontend and backend states
- All time values are stored and processed in milliseconds 