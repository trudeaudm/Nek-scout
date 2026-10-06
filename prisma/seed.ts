import { PrismaClient } from '@prisma/client'
import { calculateAllScores } from '../lib/scoring'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  const owners = await Promise.all([
    prisma.owner.create({
      data: {
        ownerName: 'Smith Family Trust',
        mailingAddress: '123 Ocean Drive, Naples, FL 34102',
        mailingState: 'FL',
        ownerType: 'trust',
        absenteeOwner: true,
        outOfStateOwner: true
      }
    }),
    prisma.owner.create({
      data: {
        ownerName: 'Estate of Robert Johnson',
        mailingAddress: '456 Main St, St. Johnsbury, VT 05819',
        mailingState: 'VT',
        ownerType: 'estate',
        absenteeOwner: false,
        outOfStateOwner: false
      }
    }),
    prisma.owner.create({
      data: {
        ownerName: 'Mountain View LLC',
        mailingAddress: '789 Business Blvd, Boston, MA 02101',
        mailingState: 'MA',
        ownerType: 'LLC',
        absenteeOwner: true,
        outOfStateOwner: true
      }
    }),
    prisma.owner.create({
      data: {
        ownerName: 'Mary Anderson',
        mailingAddress: '321 Sunset Ave, Phoenix, AZ 85001',
        mailingState: 'AZ',
        ownerType: 'individual',
        absenteeOwner: true,
        outOfStateOwner: true
      }
    }),
    prisma.owner.create({
      data: {
        ownerName: 'Green Mountain Holdings Inc',
        mailingAddress: '555 Corporate Dr, Burlington, VT 05401',
        mailingState: 'VT',
        ownerType: 'corporation',
        absenteeOwner: false,
        outOfStateOwner: false
      }
    }),
    prisma.owner.create({
      data: {
        ownerName: 'Thomas & Patricia Williams',
        mailingAddress: '123 Elm St, Lyndonville, VT 05851',
        mailingState: 'VT',
        ownerType: 'individual',
        absenteeOwner: false,
        outOfStateOwner: false
      }
    }),
    prisma.owner.create({
      data: {
        ownerName: 'Heritage Properties Trust',
        mailingAddress: '777 Coastal Rd, Charleston, SC 29401',
        mailingState: 'SC',
        ownerType: 'trust',
        absenteeOwner: true,
        outOfStateOwner: true
      }
    }),
    prisma.owner.create({
      data: {
        ownerName: 'Davis Development LLC',
        mailingAddress: '999 Commerce St, Manchester, NH 03101',
        mailingState: 'NH',
        ownerType: 'LLC',
        absenteeOwner: true,
        outOfStateOwner: true
      }
    })
  ])

  const parcels = [
    {
      parcelId: 'CAL-001-2024',
      town: 'Lyndon',
      county: 'Caledonia',
      address: '1245 Burke Mountain Road',
      acreage: 38.5,
      landValue: 120000,
      buildingValue: 45000,
      totalAssessedValue: 165000,
      yearBuilt: 1975,
      propertyClass: 'Residential',
      zoning: 'Rural Residential',
      latitude: 44.5267,
      longitude: -72.0081,
      ownerId: owners[0].id,
      transfer: {
        lastSaleDate: new Date('1989-06-15'),
        lastSalePrice: 65000,
        ownershipYears: 34,
        transferType: 'Warranty Deed'
      },
      constraints: {
        floodplain: false,
        wetlands: false,
        riverCorridor: false,
        currentUse: true,
        conservedLand: false,
        steepSlope: false,
        accessFrontageFlags: 'Road frontage confirmed'
      }
    },
    {
      parcelId: 'ORL-045-2024',
      town: 'Newport',
      county: 'Orleans',
      address: '2890 Lake Road',
      acreage: 15.2,
      landValue: 85000,
      buildingValue: 125000,
      totalAssessedValue: 210000,
      yearBuilt: 1998,
      propertyClass: '2 unit',
      zoning: 'Village Residential',
      latitude: 44.9367,
      longitude: -72.2053,
      ownerId: owners[1].id,
      transfer: {
        lastSaleDate: new Date('1982-03-22'),
        lastSalePrice: 45000,
        ownershipYears: 41,
        transferType: 'Quitclaim Deed'
      },
      constraints: {
        floodplain: false,
        wetlands: false,
        riverCorridor: false,
        currentUse: false,
        conservedLand: false,
        steepSlope: false,
        accessFrontageFlags: 'Municipal road access'
      }
    },
    {
      parcelId: 'ESS-023-2024',
      town: 'Guildhall',
      county: 'Essex',
      address: '567 Back Mountain Road',
      acreage: 125.0,
      landValue: 250000,
      buildingValue: 85000,
      totalAssessedValue: 335000,
      yearBuilt: 1968,
      propertyClass: 'Agricultural',
      zoning: 'Agricultural',
      latitude: 44.6453,
      longitude: -71.5648,
      ownerId: owners[2].id,
      transfer: {
        lastSaleDate: new Date('1995-09-10'),
        lastSalePrice: 125000,
        ownershipYears: 28,
        transferType: 'Warranty Deed'
      },
      constraints: {
        floodplain: true,
        wetlands: true,
        riverCorridor: false,
        currentUse: true,
        conservedLand: false,
        steepSlope: false,
        accessFrontageFlags: 'Private road, easement needed'
      }
    },
    {
      parcelId: 'CAL-089-2024',
      town: 'St. Johnsbury',
      county: 'Caledonia',
      address: '45 Railroad Street',
      acreage: 0.25,
      landValue: 35000,
      buildingValue: 95000,
      totalAssessedValue: 130000,
      yearBuilt: 1925,
      propertyClass: 'Residential',
      zoning: 'Downtown Commercial',
      latitude: 44.4192,
      longitude: -72.0151,
      ownerId: owners[3].id,
      transfer: {
        lastSaleDate: new Date('1987-11-05'),
        lastSalePrice: 38000,
        ownershipYears: 36,
        transferType: 'Warranty Deed'
      },
      constraints: {
        floodplain: false,
        wetlands: false,
        riverCorridor: false,
        currentUse: false,
        conservedLand: false,
        steepSlope: false,
        accessFrontageFlags: 'Town road frontage'
      }
    },
    {
      parcelId: 'ORL-112-2024',
      town: 'Derby',
      county: 'Orleans',
      address: '3456 Route 5',
      acreage: 52.8,
      landValue: 180000,
      buildingValue: 220000,
      totalAssessedValue: 400000,
      yearBuilt: 2005,
      propertyClass: 'Commercial',
      zoning: 'Highway Commercial',
      latitude: 44.9267,
      longitude: -72.1542,
      ownerId: owners[4].id,
      transfer: {
        lastSaleDate: new Date('2015-04-18'),
        lastSalePrice: 375000,
        ownershipYears: 8,
        transferType: 'Warranty Deed'
      },
      constraints: {
        floodplain: false,
        wetlands: false,
        riverCorridor: false,
        currentUse: false,
        conservedLand: false,
        steepSlope: false,
        accessFrontageFlags: 'State highway frontage'
      }
    },
    {
      parcelId: 'CAL-156-2024',
      town: 'Burke',
      county: 'Caledonia',
      address: '789 Mountain Road',
      acreage: 22.3,
      landValue: 165000,
      buildingValue: 285000,
      totalAssessedValue: 450000,
      yearBuilt: 2012,
      propertyClass: 'Residential',
      zoning: 'Resort Residential',
      latitude: 44.5936,
      longitude: -71.9181,
      ownerId: owners[5].id,
      transfer: {
        lastSaleDate: new Date('2000-07-25'),
        lastSalePrice: 145000,
        ownershipYears: 23,
        transferType: 'Warranty Deed'
      },
      constraints: {
        floodplain: false,
        wetlands: false,
        riverCorridor: false,
        currentUse: false,
        conservedLand: false,
        steepSlope: true,
        accessFrontageFlags: 'Private road, deeded access'
      }
    },
    {
      parcelId: 'ESS-067-2024',
      town: 'Concord',
      county: 'Essex',
      address: '1122 Victory Road',
      acreage: 87.5,
      landValue: 195000,
      buildingValue: 35000,
      totalAssessedValue: 230000,
      yearBuilt: 1955,
      propertyClass: 'Forest Land',
      zoning: 'Forestry',
      latitude: 44.4567,
      longitude: -71.8234,
      ownerId: owners[6].id,
      transfer: {
        lastSaleDate: new Date('1978-12-01'),
        lastSalePrice: 32000,
        ownershipYears: 45,
        transferType: 'Warranty Deed'
      },
      constraints: {
        floodplain: false,
        wetlands: true,
        riverCorridor: false,
        currentUse: true,
        conservedLand: false,
        steepSlope: true,
        accessFrontageFlags: 'Class 4 road, seasonal access'
      }
    },
    {
      parcelId: 'ORL-234-2024',
      town: 'Barton',
      county: 'Orleans',
      address: '4567 Lake Shore Drive',
      acreage: 3.8,
      landValue: 125000,
      buildingValue: 165000,
      totalAssessedValue: 290000,
      yearBuilt: 1989,
      propertyClass: 'Seasonal',
      zoning: 'Lake Residential',
      latitude: 44.7467,
      longitude: -72.1842,
      ownerId: owners[7].id,
      transfer: {
        lastSaleDate: new Date('1993-05-14'),
        lastSalePrice: 95000,
        ownershipYears: 30,
        transferType: 'Warranty Deed'
      },
      constraints: {
        floodplain: true,
        wetlands: false,
        riverCorridor: true,
        currentUse: false,
        conservedLand: false,
        steepSlope: false,
        accessFrontageFlags: 'Town road, lake frontage'
      }
    }
  ]

  for (const parcelData of parcels) {
    const { transfer, constraints, ownerId, ...parcelFields } = parcelData

    const parcel = await prisma.parcel.create({
      data: {
        ...parcelFields,
        ownerId
      },
      include: {
        owner: true,
        transfer: true,
        constraints: true
      }
    })

    await prisma.transfer.create({
      data: {
        ...transfer,
        parcelId: parcel.id
      }
    })

    await prisma.constraints.create({
      data: {
        ...constraints,
        parcelId: parcel.id
      }
    })

    const parcelWithRelations = await prisma.parcel.findUnique({
      where: { id: parcel.id },
      include: {
        owner: true,
        transfer: true,
        constraints: true
      }
    })

    if (parcelWithRelations) {
      const scores = calculateAllScores(parcelWithRelations as any)

      await prisma.scores.create({
        data: {
          parcelId: parcel.id,
          ...scores
        }
      })
    }

    console.log(`Created parcel: ${parcel.parcelId}`)
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
