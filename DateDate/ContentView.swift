//
//  ContentView.swift
//  DateDate
//
//  Created by Harold on 2026/1/28.
//

import SwiftUI
import NFCPassportReader

struct ContentView: View {
    @State private var showScanner = false
    @State private var scanError: String?
    @State private var passportData: MRZData?
    @State private var passportImage: UIImage?
    @State private var passportDetails: String = ""
    @State private var isNFCReading = false
    
    // Passport Reader instance
    private let passportReader = PassportReader()
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                if let data = passportData {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Scanned MRZ Data:")
                            .font(.headline)
                        Text("Doc Number: \(data.documentNumber)")
                        Text("Birth Date: \(formatDate(data.birthDate))")
                        Text("Expiry Date: \(formatDate(data.expiryDate))")
                        
                        Divider()
                        
                        if isNFCReading {
                            ProgressView("Reading NFC Chip...")
                        } else {
                            if let image = passportImage {
                                Image(uiImage: image)
                                    .resizable()
                                    .scaledToFit()
                                    .frame(height: 200)
                            }
                            
                            Text(passportDetails)
                                .font(.caption)
                            
                            Button(action: startNFCRead) {
                                Label("Start NFC Read", systemImage: "wave.3.right.circle.fill")
                                    .font(.title2)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.blue)
                                    .foregroundColor(.white)
                                    .cornerRadius(10)
                            }
                        }
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(12)
                    .padding()
                    
                    Button("Reset") {
                        passportData = nil
                        passportDetails = ""
                        passportImage = nil
                    }
                } else {
                    VStack {
                        Image(systemName: "text.viewfinder")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        Text("Please scan the bottom text line (MRZ) of your passport")
                            .multilineTextAlignment(.center)
                            .padding()
                        
                        Button(action: { showScanner = true }) {
                            Text("Scan Passport MRZ")
                                .font(.headline)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                        .padding(.horizontal)
                    }
                }
                
                if let error = scanError {
                    Text(error)
                        .foregroundColor(.red)
                        .padding()
                }
            }
            .navigationTitle("Passport NFC")
            .sheet(isPresented: $showScanner) {
                MRZScannerView { mrzText in
                    print("MRZ Scanned: \(mrzText)")
                    if let data = PassportUtils.parseMRZ(mrzString: mrzText) {
                        self.passportData = data
                        self.scanError = nil
                    } else {
                        self.scanError = "Failed to parse MRZ data"
                    }
                    self.showScanner = false
                }
            }
        }
    }
    
    func formatDate(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateStyle = .medium
        return f.string(from: date)
    }
    
    func startNFCRead() {
        guard let data = passportData else { return }
        
        let mrzKey = PassportUtils.getMRZKey(
            passportNumber: data.documentNumber,
            birthDate: data.birthDate,
            expiryDate: data.expiryDate
        )
        
        // This key (e.g. "12345678<898012772508315") is used for BAC (Basic Access Control)
        
        isNFCReading = true
        scanError = nil
        
        Task {
            do {
                // Usually we read DG1 (MRZ), DG2 (Face), SOD (Security Object)
                // .DG1, .DG2, .DG11, .DG12, .DG14, .SOD
                let passport = try await passportReader.readPassport(mrzKey: mrzKey, tags: [.DG1, .DG2, .DG11, .SOD])
                
                await MainActor.run {
                    self.passportDetails = """
                    Name: \(passport.firstName) \(passport.lastName)
                    Gender: \(passport.gender)
                    Nationality: \(passport.nationality)
                    """
                    self.passportImage = passport.passportImage
                    self.isNFCReading = false
                }
            } catch {
                await MainActor.run {
                    self.passportDetails = "Error: \(error.localizedDescription)"
                    self.isNFCReading = false
                }
            }
        }
    }
}

#Preview {
    ContentView()
}
