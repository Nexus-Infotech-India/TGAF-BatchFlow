import { PrismaClient } from '../../../src/generated/prisma';
import { v4 as uuidv4 } from 'uuid';
import { ParameterDataType } from '../../../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed data creation for hot pepper powder categories and parameters...');
  
  // Create additional units needed for hot pepper powder
  const units = [
    {
      name: 'Percentage',
      symbol: '%',
      description: 'Percentage value'
    },
    {
      name: 'Weight/weight',
      symbol: '%w/w',
      description: 'Weight per weight percentage'
    },
    {
      name: 'Volume/weight',
      symbol: '%v/w',
      description: 'Volume per weight percentage'
    },
    {
      name: 'CFU per gram',
      symbol: 'cfu/g',
      description: 'Colony forming units per gram'
    },
    {
      name: 'SHU',
      symbol: 'SHU',
      description: 'Scoville Heat Units'
    },
    {
      name: 'ASTA',
      symbol: 'ASTA',
      description: 'American Spice Trade Association color value'
    },
    {
      name: 'PPB',
      symbol: 'ppb',
      description: 'Parts per billion'
    },
    {
      name: 'Microns',
      symbol: 'μm',
      description: 'Micrometers for particle size'
    },
    {
      name: 'Unitless',
      symbol: '-',
      description: 'Qualitative or descriptive parameter with no unit'
    }
  ];
  
  const createdUnits: { [key: string]: any } = {};
  
  for (const unit of units) {
    const createdUnit = await prisma.unitOfMeasurement.upsert({
      where: { name: unit.name },
      update: {},
      create: {
        id: uuidv4(),
        name: unit.name,
        symbol: unit.symbol,
        description: unit.description,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`Created unit: ${createdUnit.name} (${createdUnit.id})`);
    createdUnits[createdUnit.name] = createdUnit;
  }
  
  // Create the hot pepper powder product
  const hotPepperPowder = await prisma.product.upsert({
    where: { name: 'Hot Pepper powder' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Hot Pepper powder',
      code: 'PEPPER-001',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  
  console.log(`Created product: ${hotPepperPowder.name} (${hotPepperPowder.id})`);
  
  // Create the standard categories from the COA
  const categories = [
    {
      name: 'Organoleptic',
      description: 'Sensory characteristics'
    },
    {
      name: 'Physical',
      description: 'Physical properties'
    },
    {
      name: 'Chemical Characteristics',
      description: 'Chemical composition and properties'
    },
    {
      name: 'Microbiology',
      description: 'Microbiological parameters'
    }
  ];
  
  const createdCategories: { [key: string]: any } = {};
  
  for (const category of categories) {
    const createdCategory = await prisma.standardCategory.upsert({
      where: { name: category.name },
      update: {},
      create: {
        id: uuidv4(),
        name: category.name,
        description: category.description,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`Created standard category: ${createdCategory.name} (${createdCategory.id})`);
    createdCategories[createdCategory.name] = createdCategory;
    
    // Link category with product using ProductStandardCategory
    await prisma.productStandardCategory.upsert({
      where: {
        productId_categoryId: {
          productId: hotPepperPowder.id,
          categoryId: createdCategory.id
        }
      },
      update: {},
      create: {
        id: uuidv4(),
        productId: hotPepperPowder.id,
        categoryId: createdCategory.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`Linked category ${createdCategory.name} with product ${hotPepperPowder.name}`);
  }
  
  // Create parameters for each category - Using generic names with PEPPER productType
  const parameters = [
    // Organoleptic parameters
    {
      name: 'Appearance',
      description: 'Visual appearance of the hot pepper powder',
      categoryName: 'Organoleptic',
      dataType: 'TEXT',
      productType: 'PEPPER'
    },
    {
      name: 'Color',
      description: 'Color of the hot pepper powder',
      categoryName: 'Organoleptic',
      dataType: 'TEXT',
      productType: 'PEPPER'
    },
    {
      name: 'Aroma',
      description: 'Aroma/smell characteristics of the hot pepper powder',
      categoryName: 'Organoleptic',
      dataType: 'TEXT',
      productType: 'PEPPER'
    },
    
    // Physical parameters
    {
      name: 'Particle size',
      description: 'Size of hot pepper powder particles',
      categoryName: 'Physical',
      dataType: 'TEXT',
      productType: 'PEPPER'
    },
    {
      name: 'Pass through US sieve #20 (min) 420mm',
      description: 'Percentage passing through 420mm sieve',
      categoryName: 'Physical',
      dataType: 'FLOAT',
      productType: 'PEPPER'
    },
    {
      name: 'Extraneous & Foreign Matter (Max)',
      description: 'Maximum foreign matter content in pepper',
      categoryName: 'Physical',
      dataType: 'FLOAT',
      productType: 'PEPPER'
    },
    
    // Chemical Characteristics parameters
    {
      name: 'Moisture (max)',
      description: 'Maximum moisture content in pepper',
      categoryName: 'Chemical Characteristics',
      dataType: 'FLOAT',
      productType: 'PEPPER'
    },
    {
      name: 'Total Ash (max)',
      description: 'Maximum total ash content in pepper',
      categoryName: 'Chemical Characteristics',
      dataType: 'FLOAT',
      productType: 'PEPPER'
    },
    {
      name: 'Acid Insoluble Ash (max)',
      description: 'Maximum acid insoluble ash content in pepper',
      categoryName: 'Chemical Characteristics',
      dataType: 'FLOAT',
      productType: 'PEPPER'
    },
    {
      name: 'Scoville Heat (Capsaicin)',
      description: 'Scoville heat units - capsaicin content',
      categoryName: 'Chemical Characteristics',
      dataType: 'INTEGER',
      productType: 'PEPPER'
    },
    {
      name: 'Colour Value',
      description: 'ASTA color value for pepper',
      categoryName: 'Chemical Characteristics',
      dataType: 'FLOAT',
      productType: 'PEPPER'
    },
    {
      name: 'Aflatoxin Total',
      description: 'Total aflatoxin content in pepper',
      categoryName: 'Chemical Characteristics',
      dataType: 'FLOAT',
      productType: 'PEPPER'
    },
    
    // Microbiology parameters
    {
      name: 'Total plate count',
      description: 'Total microbial plate count in pepper',
      categoryName: 'Microbiology',
      dataType: 'INTEGER',
      productType: 'PEPPER'
    },
    {
      name: 'Yeast/mold',
      description: 'Yeast and mold count in pepper',
      categoryName: 'Microbiology',
      dataType: 'INTEGER',
      productType: 'PEPPER'
    },
    {
      name: 'Salmonella',
      description: 'Presence of Salmonella in pepper',
      categoryName: 'Microbiology',
      dataType: 'TEXT',
      productType: 'PEPPER'
    },
    {
      name: 'Coliforms',
      description: 'Coliform bacteria count in pepper',
      categoryName: 'Microbiology',
      dataType: 'INTEGER',
      productType: 'PEPPER'
    },
    {
      name: 'E.coli',
      description: 'E. coli count in pepper',
      categoryName: 'Microbiology',
      dataType: 'INTEGER',
      productType: 'PEPPER'
    },
    {
      name: 'Staph.aureus',
      description: 'Staphylococcus aureus count in pepper',
      categoryName: 'Microbiology',
      dataType: 'INTEGER',
      productType: 'PEPPER'
    }
  ];
  
  const createdParameters: any[] = [];
  
  for (const param of parameters) {
    // Find the category
    const category = createdCategories[param.categoryName];
    
    if (!category) {
      console.log(`Category not found for parameter: ${param.name}`);
      continue;
    }
    
    // Create the parameter with productType
    const parameterId = uuidv4();
    const createdParam = await prisma.standardParameter.create({
      data: {
        id: parameterId,
        name: param.name,
        description: param.description,
        dataType: param.dataType as ParameterDataType,
        categoryId: category.id,
        productType: param.productType,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`Created parameter: ${createdParam.name} (${createdParam.productType}) for category ${param.categoryName}`);
    createdParameters.push(createdParam);
    
    // Link parameter to hot pepper powder product
    await prisma.productParameter.create({
      data: {
        id: uuidv4(),
        productId: hotPepperPowder.id,
        parameterId: createdParam.id,
        isRequired: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`Linked parameter ${createdParam.name} to product ${hotPepperPowder.name}`);
  }
  
  console.log(`Created ${createdParameters.length} parameters for hot pepper powder`);
  console.log('Hot pepper powder seed data creation completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed data creation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });